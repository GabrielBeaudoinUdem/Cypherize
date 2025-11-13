import { NextResponse } from 'next/server';
import { callLLM } from '../../../../lib/ai-providers';

const cleanLlmResponse = (response) => {
  if (!response) return '';
  return response.replace(/^```[a-z]*\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
};

export async function POST(request) {
  try {
    const { config, step, documentText, importMode, existingSchema, schema } = await request.json();

    if (!config || !documentText) {
      return NextResponse.json({ error: 'Configuration or document is missing.' }, { status: 400 });
    }

    if (step === 'check_schema_necessity') {
        const systemPrompt = `You are a Kuzu database schema analyst. You will be given an existing schema and a new document.
Your task is to determine if new NODE or REL tables are required to represent the information in the document that are not already present in the schema.
Respond ONLY with a valid JSON object with a single key "new_tables_required" which is a boolean (true or false).`;
        const userContent = `EXISTING SCHEMA:
---
${existingSchema}
---

NEW DOCUMENT:
---
${documentText}
---

Based on the document, are any new tables (NODE or REL) required that don't already exist in the schema?`;

        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        const llmResponse = await callLLM(config, messages);
        try {
            const result = JSON.parse(cleanLlmResponse(llmResponse));
            return NextResponse.json(result);
        } catch (e) {
            console.error("Failed to parse JSON from LLM for schema check:", llmResponse);
            return NextResponse.json({ error: "AI failed to provide a valid decision." }, { status: 500 });
        }
    }

    if (step === 'generate_schema') {
        let systemPrompt = '';
        if (importMode === 'append') {
            systemPrompt = `You are an expert Kuzu database designer. An existing schema is provided. Based on a new document, generate ONLY THE NEW Kuzu Cypher DDL queries (CREATE NODE/REL TABLE) required for concepts NOT ALREADY in the existing schema.
Do NOT repeat definitions for tables that already exist.
CRITICAL RULE: Every new table MUST include 'id SERIAL' and 'PRIMARY KEY (id)'.`;
        } else {
            systemPrompt = `You are an expert Kuzu database designer. Based on the following document, create a full graph schema.
Respond ONLY with Kuzu Cypher DDL queries (CREATE NODE/REL TABLE).
CRITICAL RULE: Every table MUST include 'id SERIAL' and 'PRIMARY KEY (id)'.`;
        }
        
        const userContent = `${importMode === 'append' ? `EXISTING SCHEMA:\n---\n${existingSchema}\n---\n\n` : ''}NEW DOCUMENT:\n---\n${documentText}\n---`;
        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        const llmResponse = await callLLM(config, messages);
        return NextResponse.json({ schema: cleanLlmResponse(llmResponse) });
    }

    if (step === 'generate_data') {
        if (!schema) {
            return NextResponse.json({ error: 'Schema context is required to generate data.' }, { status: 400 });
        }
        const systemPrompt = `You are a Kuzu data entry specialist. You are given a document and a Kuzu database schema.
Your task is to extract all relevant information from the document and convert it into Kuzu Cypher DML queries (MERGE, CREATE) to populate the database.
Respond ONLY with the Cypher queries.`;
        const userContent = `SCHEMA:\n\`\`\`cypher\n${schema}\n\`\`\`\n\nDOCUMENT:\n---\n${documentText}\n---`;
        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        const llmResponse = await callLLM(config, messages);
        return NextResponse.json({ queries: cleanLlmResponse(llmResponse) });
    }

    return NextResponse.json({ error: 'Invalid step provided.' }, { status: 400 });

  } catch (error) {
    console.error("Error in /api/ai/import:", error);
    return NextResponse.json({ error: error.message || "Error communicating with the AI service." }, { status: 500 });
  }
}