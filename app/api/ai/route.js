import { NextResponse } from 'next/server';
import { getDbSchema, executeCypherQuery } from '../../../lib/kuzu-db';

async function callLLM(config, messages) {
  const payload = {
    model: config.model,
    messages: messages,
    temperature: 0.2,
    stream: false,
  };

  const externalResponse = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!externalResponse.ok) {
    const errorBody = await externalResponse.text();
    console.error("Erreur de l'API externe:", errorBody);
    throw new Error(`L'API externe a répondu avec le statut ${externalResponse.status}.`);
  }
  
  return await externalResponse.json();
}

export async function POST(request) {
  try {
    const { config, prompt, confirmedQuery } = await request.json();

    if (!config || !config.url || !config.model) {
      return NextResponse.json({ error: 'Configuration du modèle IA manquante.' }, { status: 400 });
    }
    
    if (confirmedQuery) {
        try {
            await executeCypherQuery(confirmedQuery);
            return NextResponse.json({ type: 'answer', text: "La modification a été effectuée avec succès." });
        } catch(e) {
            return NextResponse.json({ type: 'answer', text: `Erreur lors de l'exécution de la requête: ${e.message}` });
        }
    }
    
    if (!prompt) {
        return NextResponse.json({ error: 'Message utilisateur manquant.' }, { status: 400 });
    }

    const dbSchema = await getDbSchema();
    const schemaString = JSON.stringify(dbSchema, null, 2);

    const planningMessages = [
      {
        role: 'system',
        content: `Tu es un expert Cypher pour une base de données Kuzu. Analyse la demande de l'utilisateur et le schéma de la base fourni.
Réponds UNIQUEMENT avec un objet JSON contenant deux clés:
1. "intent": "read" si l'utilisateur demande une information, ou "write" si l'utilisateur veut créer, modifier ou supprimer des données.
2. "query": La requête Cypher complète pour accomplir la tâche.

Schema de la base:
${schemaString}`
      },
      { role: 'user', content: prompt }
    ];

    const planningResponse = await callLLM(config, planningMessages);
    let plan;
    try {
        const content = planningResponse.choices[0]?.message?.content;
        plan = JSON.parse(content);
        if (!plan.intent || !plan.query) throw new Error("Format JSON invalide");
    } catch(e) {
        console.error("Erreur parsing de la réponse du LLM:", e);
        return NextResponse.json({ type: 'answer', text: "Désolé, je n'ai pas pu générer de requête valide. Essayez de reformuler." });
    }

    if (plan.intent === 'write') {
      return NextResponse.json({ type: 'confirmation', query: plan.query });

    } else if (plan.intent === 'read') {
      let queryResult;
      try {
          queryResult = await executeCypherQuery(plan.query);
      } catch (e) {
          return NextResponse.json({ type: 'answer', text: `J'ai essayé d'exécuter une requête, mais j'ai eu une erreur: ${e.message}`});
      }

      const finalAnswerMessages = [
        {
          role: 'system',
          content: "Tu es un assistant serviable. En te basant sur la question originale de l'utilisateur et les données JSON suivantes extraites de la base de données, fournis une réponse claire et concise en langage naturel. Ne montre pas les données JSON à l'utilisateur."
        },
        { role: 'user', content: `Ma question était: "${prompt}"\n\nVoici les données obtenues:\n${JSON.stringify(queryResult, null, 2)}` }
      ];

      const finalResponse = await callLLM(config, finalAnswerMessages);
      const answerText = finalResponse.choices[0]?.message?.content || "Je n'ai pas pu formuler de réponse.";
      
      return NextResponse.json({ type: 'answer', text: answerText });
    } else {
        return NextResponse.json({ type: 'answer', text: `Intention non reconnue: ${plan.intent}` });
    }

  } catch (error) {
    console.error("Erreur interne dans /api/ai:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la communication avec le service IA." }, { status: 500 });
  }
}