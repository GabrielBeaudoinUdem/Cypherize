import { NextResponse } from 'next/server';
import { callLLM } from '../../../../lib/ai-providers';


const cleanLlmResponse = (response) => {
  if (!response) return '';
  return response
    .replace(/^```[a-z]*\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();
};


export async function POST(request) {
  try {
    const { config, step, documentText, schema } = await request.json();

    if (!config || !documentText) {
      return NextResponse.json({ error: 'Configuration or document is missing.' }, { status: 400 });
    }

    if (step === 'generate_schema') {
      const systemPrompt = `You are an expert Kuzu database designer. Based on the following document, create a graph schema.
Respond ONLY with Kuzu Cypher DDL queries (CREATE NODE/REL TABLE).
CRITICAL RULE: Every table, both NODE and REL, MUST include a property named 'id' of type 'SERIAL' which is also set as the 'PRIMARY KEY'.
This is mandatory.
Example for a NODE table: CREATE NODE TABLE Person(id SERIAL, name STRING, age INT64, PRIMARY KEY (id));
Example for a REL table: CREATE REL TABLE KNOWS(FROM Person TO Person, since DATE, id SERIAL, PRIMARY KEY (id));
Analyze the document and define appropriate node and relationship tables with their properties.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the document:\n\n---\n\n${documentText}` }
      ];

      const llmResponse = await callLLM(config, messages);
      const cleanedSchema = cleanLlmResponse(llmResponse);

      return NextResponse.json({ schema: cleanedSchema });

    } else if (step === 'generate_data') {
        if (!schema) {
            return NextResponse.json({ error: 'Schema is required to generate data.' }, { status: 400 });
        }
        
      const systemPrompt = `You are a Kuzu data entry specialist. You are given a document and a Kuzu database schema.
Your task is to extract all relevant information from the document and convert it into Kuzu Cypher DML queries to populate the database according to the provided schema.
Respond ONLY with the Cypher queries.
- Use MERGE on a unique property (like name or title) for nodes to prevent duplicates. If no clear unique property exists, use CREATE.
- For relationships, MATCH the source and destination nodes and then CREATE the relationship between them.
- Ensure all property values are correctly formatted (e.g., strings in quotes, numbers as is).`;

      const userContent = `SCHEMA:
\`\`\`cypher
${schema}
\`\`\`

DOCUMENT:
---
${documentText}
---

Now, generate the Cypher queries to create the nodes and relationships described in the document.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ];

      const llmResponse = await callLLM(config, messages);
      const cleanedQueries = cleanLlmResponse(llmResponse);

      return NextResponse.json({ queries: cleanedQueries });
    }

    return NextResponse.json({ error: 'Invalid step provided.' }, { status: 400 });

  } catch (error) {
    console.error("Error in /api/ai/import:", error);
    return NextResponse.json({ error: error.message || "Error communicating with the AI service." }, { status: 500 });
  }
}