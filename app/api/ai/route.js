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
    console.error("External API Error:", errorBody);
    throw new Error(`External API responded with status ${externalResponse.status}.`);
  }
  
  return await externalResponse.json();
}

export async function POST(request) {
  try {
    const { config, prompt, confirmedQuery } = await request.json();

    if (!config || !config.url || !config.model) {
      return NextResponse.json({ error: 'AI model configuration is missing.' }, { status: 400 });
    }

    if (confirmedQuery) {
        try {
            await executeCypherQuery(confirmedQuery);
            return NextResponse.json({ type: 'answer', text: "The modification was successful.", success: true });
        } catch(e) {
            return NextResponse.json({ type: 'answer', text: `Error executing query: ${e.message}`, success: false });
        }
    }
    
    if (!prompt) {
        return NextResponse.json({ error: 'User message is missing.' }, { status: 400 });
    }

    const dbSchema = await getDbSchema();
    const schemaString = JSON.stringify(dbSchema, null, 2);

    const planningMessages = [
      {
        role: 'system',
        content: `You are a Cypher expert for a Kuzu database. Analyze the user's request and the provided database schema.
Respond ONLY with a JSON object containing two keys:
1. "intent": "read" if the user is asking for information, or "write" if the user wants to create, modify, or delete data.
2. "query": The complete Cypher query to accomplish the task.

Database Schema:
${schemaString}`
      },
      { role: 'user', content: prompt }
    ];

    const planningResponse = await callLLM(config, planningMessages);
    let plan;
    try {
        const content = planningResponse.choices[0]?.message?.content;
        plan = JSON.parse(content);
        if (!plan.intent || !plan.query) throw new Error("Invalid JSON format");
    } catch(e) {
        console.error("Error parsing LLM response:", e);
        return NextResponse.json({ type: 'answer', text: "Sorry, I couldn't generate a valid query. Please try rephrasing.", success: false });
    }

    if (plan.intent === 'write') {
      return NextResponse.json({ type: 'confirmation', query: plan.query });
    } else if (plan.intent === 'read') {
      let queryResult;
      try {
          queryResult = await executeCypherQuery(plan.query);
      } catch (e) {
          return NextResponse.json({ type: 'answer', text: `I tried to execute a query, but an error occurred: ${e.message}`, success: false });
      }

      const finalAnswerMessages = [
        {
          role: 'system',
          content: "You are a helpful assistant. Based on the user's original question and the following JSON data extracted from the database, provide a clear and concise answer in natural language. Do not show the JSON data to the user."
        },
        { role: 'user', content: `My question was: "${prompt}"\n\nHere is the data obtained:\n${JSON.stringify(queryResult, null, 2)}` }
      ];

      const finalResponse = await callLLM(config, finalAnswerMessages);
      const answerText = finalResponse.choices[0]?.message?.content || "I was unable to formulate a response.";
      
      return NextResponse.json({ type: 'answer', text: answerText, query: plan.query, data: queryResult, success: true });
    } else {
      return NextResponse.json({ type: 'answer', text: `Unrecognized intent: ${plan.intent}`, success: false });
    }

  } catch (error) {
    console.error("Internal error in /api/ai:", error);
    return NextResponse.json({ error: error.message || "Error communicating with the AI service." }, { status: 500 });
  }
}