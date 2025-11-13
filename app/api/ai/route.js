import { NextResponse } from 'next/server';
import { getDbSchema, executeCypherQuery } from '../../../lib/kuzu-db';
import { callLLM } from '../../../lib/ai-providers';

export async function POST(request) {
  try {
    const { config, prompt, confirmedQuery, history } = await request.json();

    if (!config || !config.provider) {
      return NextResponse.json({ error: 'AI provider configuration is missing.' }, { status: 400 });
    }

    // --- Chemin 1: Exécution d'une requête d'écriture confirmée ---
    if (confirmedQuery) {
        try {
            const writeResult = await executeCypherQuery(confirmedQuery);
            return NextResponse.json({ 
                type: 'answer', 
                text: "The modification was successful.",
                query: confirmedQuery,
                data: writeResult,
                success: true 
            });
        } catch(e) {
            return NextResponse.json({ 
                type: 'answer', 
                text: `An error occurred: ${e.message}`,
                query: confirmedQuery,
                data: null,
                success: false 
            });
        }
    }

    if (!prompt) {
        return NextResponse.json({ error: 'User message is missing.' }, { status: 400 });
    }

    const dbSchema = await getDbSchema();
    const schemaString = JSON.stringify(dbSchema, null, 2);

    const systemPrompt = `You are a Cypher expert for a Kuzu database. Your task is to analyze the user's request and the database schema to decide on the correct action.
Respond ONLY with a JSON object with two keys: "intent" and "query".

--- INTENTS ---
1. "visualize": If the user wants to SEE or DISPLAY data on the graph (e.g., "Show me all actors").
2. "read": If the user asks a question that requires a textual answer (e.g., "How many actors are there?").
3. "write": If the user wants to CREATE, MODIFY, or DELETE DATA (nodes or relationships).
4. "schema_write": If the user wants to modify the SCHEMA (e.g., "Create a new table for Companies").

--- DATABASE SCHEMA CONTEXT ---
${schemaString}`;

    const planningMessages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: prompt }
    ];

    const planningResponseContent = await callLLM(config, planningMessages);
    let plan;
    try {
        const cleaned = planningResponseContent.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
        plan = JSON.parse(cleaned);
        if (!plan.intent || !plan.query) throw new Error("Invalid JSON format from LLM.");
    } catch (e) {
        console.error("Error parsing LLM planning response:", e, `\nContent: ${planningResponseContent}`);
        return NextResponse.json({ type: 'answer', text: "Sorry, I couldn't generate a valid query. Please try rephrasing.", success: false });
    }

    // --- Chemin 2: Gestion des différentes intentions ---
    switch (plan.intent) {
      case 'write':
      {
        return NextResponse.json({ type: 'confirmation', query: plan.query });
      }
      case 'schema_write': {
        const validationPrompt = `
      You are a Cypher expert. Check the following CREATE TABLE query:
      "${plan.query}"

      --- CRITICAL RULE ---
      Whenever you generate a 'CREATE NODE TABLE' or 'CREATE REL TABLE' query, you MUST include an 'id' column defined as 'SERIAL' and set it as the 'PRIMARY KEY'. This is mandatory for all new tables.
      - Example for a NODE table: CREATE NODE TABLE Person(id SERIAL, name STRING, PRIMARY KEY (id))
      - Example for a REL table: CREATE REL TABLE KNOWS(FROM Person TO Person, since DATE, id SERIAL, PRIMARY KEY (id))

      If the query does not comply with this rule, rewrite it so that it does otherwise just give it back. Respond ONLY with the corrected Cypher query, no more explanation just the query.
      `;
        let validatedQuery;
        try {
          validatedQuery = await callLLM(config, [
            { role: 'system', content: validationPrompt }
          ]);
          validatedQuery = validatedQuery.replace(/```cypher\s*/i, '').replace(/```/g, '').trim();
        } catch (e) {
          console.error("Error validating schema query:", e);
          return NextResponse.json({ 
            type: 'answer', 
            text: "Failed to validate the schema query. Please check the syntax.", 
            success: false 
          });
        }
        return NextResponse.json({ type: 'confirmation', query: validatedQuery });
      }
      case 'visualize':
        try {
            const queryResult = await executeCypherQuery(plan.query);
            return NextResponse.json({ type: 'graph', query: plan.query, data: queryResult, success: true });
        } catch (e) {
            return NextResponse.json({ type: 'answer', text: `I tried to execute a query for visualization, but an error occurred: ${e.message}`, success: false });
        }

      case 'read':
        let queryResultForRead;
        try {
            queryResultForRead = await executeCypherQuery(plan.query);
        } catch (e) {
            return NextResponse.json({ type: 'answer', text: `I tried to execute a query, but an error occurred: ${e.message}`, success: false });
        }

        const finalAnswerMessages = [
          {
            role: 'system',
            content: "You are a helpful assistant. Based on the user's original question and the following JSON data from the database, provide a clear and concise answer in natural language. Do not show the JSON data to the user. If the data is empty, say so."
          },
          { role: 'user', content: `My question was: "${prompt}"\n\nHere is the data obtained:\n${JSON.stringify(queryResultForRead, null, 2)}` }
        ];

        const answerText = await callLLM(config, finalAnswerMessages) || "I was unable to formulate a response.";
        return NextResponse.json({ type: 'answer', text: answerText, query: plan.query, data: queryResultForRead, success: true });

      default:
        return NextResponse.json({ type: 'answer', text: `Unrecognized intent: ${plan.intent}`, success: false });
    }

  } catch (error) {
    console.error("Internal error in /api/ai:", error);
    return NextResponse.json({ error: error.message || "Error communicating with the AI service." }, { status: 500 });
  }
}