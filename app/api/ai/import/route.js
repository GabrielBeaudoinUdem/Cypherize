import { NextResponse } from 'next/server';
import { callLLM } from '../../../../lib/ai-providers';
import { validateSchemaCypher, validateDataCypher } from '../../../../lib/cypher-validator';

const MAX_RETRIES = 3;

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

    // --- Étape : Génération du schéma ---
    if (step === 'generate_schema') {
        const criticalRule = `--- CRITICAL RULES FOR KUZU SCHEMA ---
1.  **Output Format**: Respond ONLY with the Cypher DDL queries. Do not add any explanations, markdown, or comments unless specified.
2.  **Mandatory Columns**: Every new table (NODE or REL) MUST include 'id SERIAL' and 'PRIMARY KEY (id)'. This is non-negotiable.
3.  **Relationship Syntax**: For REL tables, you MUST use the 'FROM TableName TO TableName' syntax. DO NOT use SQL-like 'REFERENCES' syntax.
4.  **Data Types**: You MUST use Kuzu-native data types. For text, use 'STRING'. Do NOT use 'VARCHAR', 'TEXT', or any other SQL types. Other valid types include INT64, DOUBLE, BOOLEAN, DATE.
5.  **REL TABLE Constraint**: The table names used in the 'FROM' and 'TO' clauses of a REL TABLE MUST refer to NODE TABLE names defined in the same output. Do not invent or reference tables that do not exist in your response.
- Correct NODE Table Example: CREATE NODE TABLE Person(id SERIAL, name STRING, PRIMARY KEY (id));
- Correct REL Table Example: CREATE REL TABLE KNOWS(FROM Person TO Person, since DATE, id SERIAL, PRIMARY KEY (id));`;

        let systemPrompt = '';
        if (importMode === 'append') {
            systemPrompt = `You are an expert Kuzu database designer tasked with extending an existing schema.
An existing schema is provided. Your task is to analyze a new document and generate ONLY the additional Kuzu Cypher DDL queries required for concepts that are NOT ALREADY defined in the existing schema.
- If the document contains no new concepts that require new tables, respond with an empty string or a comment like '-- No new schema required.'.
- Do NOT repeat or modify existing table definitions.
${criticalRule}`;
        } else { // overwrite
            systemPrompt = `You are an expert Kuzu database designer tasked with creating a new schema from scratch.
Based on the provided document, create a complete and normalized graph schema using Kuzu Cypher DDL.
${criticalRule}`;
        }
        
        const userContent = `${importMode === 'append' ? `EXISTING SCHEMA:\n---\n${existingSchema}\n---\n\n` : ''}NEW DOCUMENT:\n---\n${documentText}\n---`;
        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        
        let finalSchema = '';
        let isValid = false;

        for (let i = 0; i < MAX_RETRIES; i++) {
            console.log(`Attempt ${i + 1} to generate schema...`);
            const llmResponse = await callLLM(config, messages);
            const cleanedResponse = cleanLlmResponse(llmResponse);
            
            // Si la réponse est vide (cas valide pour 'append'), on arrête.
            if (cleanedResponse.trim() === '' || cleanedResponse.trim().startsWith('--')) {
                finalSchema = '';
                isValid = true;
                break;
            }

            if (validateSchemaCypher(cleanedResponse)) {
                finalSchema = cleanedResponse;
                isValid = true;
                break;
            } else {
                console.warn(`Attempt ${i + 1} failed validation. Retrying...`);
                messages.push({role: 'assistant', content: cleanedResponse});
                messages.push({role: 'user', content: 'The schema you provided is invalid. Please strictly follow all the critical rules and provide a corrected version.'});
            }
        }

        if (!isValid) {
            return NextResponse.json({ error: `After ${MAX_RETRIES} attempts, the AI failed to generate a valid schema.` }, { status: 500 });
        }

        return NextResponse.json({ schema: finalSchema });
    }

    // --- Étape : Génération des données ---
    if (step === 'generate_data') {
        if (!schema) return NextResponse.json({ error: 'Schema context is required to generate data.' }, { status: 400 });

        const systemPrompt = `You are a Kuzu data entry specialist. Your task is to convert a document into Kuzu Cypher DML queries based on a given schema.
--- CRITICAL RULES FOR DATA QUERIES ---
1.  **Output Format**: Respond ONLY with the Cypher queries. Do not add any explanations or markdown.
2.  **Node Creation**: Create all nodes first using 'MERGE (:Label {unique_property: 'value'});'.
3.  **Relationship Creation**: To create relationships, you MUST use the 'MATCH (a:Label), MATCH (b:Label), MERGE (a)-[:REL]->(b)' pattern in the same query. This is mandatory to avoid scope errors.

--- CORRECT PATTERN for relationships ---
MATCH (n:Organization {name: 'open ai'}), (m:Model {name: 'gpt'}) CREATE (n)-[:DEVELOPED]->(m);`;

        const userContent = `SCHEMA:\n\`\`\`cypher\n${schema}\n\`\`\`\n\nDOCUMENT:\n---\n${documentText}\n---`;
        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        
        let finalQueries = '';
        let isValid = false;

        for (let i = 0; i < MAX_RETRIES; i++) {
            console.log(`Attempt ${i + 1} to generate data queries...`);
            const llmResponse = await callLLM(config, messages);
            const cleanedResponse = cleanLlmResponse(llmResponse);
            
            if (validateDataCypher(cleanedResponse)) {
                finalQueries = cleanedResponse;
                isValid = true;
                break;
            } else {
                console.warn(`Attempt ${i + 1} failed validation. Retrying...`);
                messages.push({role: 'assistant', content: cleanedResponse});
                messages.push({role: 'user', content: 'The queries you provided are invalid. Remember to strictly use the MATCH ... MATCH ... MERGE pattern for creating relationships. Please provide a corrected version.'});
            }
        }

        if (!isValid) {
            return NextResponse.json({ error: `After ${MAX_RETRIES} attempts, the AI failed to generate valid data queries.` }, { status: 500 });
        }
        
        return NextResponse.json({ queries: finalQueries });
    }

    return NextResponse.json({ error: 'Invalid step provided.' }, { status: 400 });

  } catch (error)
 {
    console.error("Error in /api/ai/import:", error);
    return NextResponse.json({ error: error.message || "Error communicating with the AI service." }, { status: 500 });
  }
}