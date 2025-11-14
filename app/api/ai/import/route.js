import { NextResponse } from 'next/server';
import { callLLM } from '../../../../lib/ai-providers';
import { validateSchemaCypher, validateNodeCypher, validateRelationshipCypher } from '../../../../lib/cypher-validator';

const MAX_RETRIES = 3;

const ensureSemicolons = (cypherString) => {
  if (!cypherString || cypherString.trim() === '') return '';
  return cypherString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .join(';\n') + ';';
};

const reorderSchemaQueries = (cypher) => {
  if (!cypher) return '';
  const statements = cypher.split(';').map(s => s.trim()).filter(Boolean);
  const nodeTableStatements = statements.filter(s => /^CREATE\s+NODE\s+TABLE/i.test(s));
  const relTableStatements = statements.filter(s => /^CREATE\s+REL\s+TABLE/i.test(s));
  const otherStatements = statements.filter(s => !/^CREATE\s+(NODE|REL)\s+TABLE/i.test(s));
  const sortedStatements = [...nodeTableStatements, ...relTableStatements, ...otherStatements];
  return sortedStatements.join(';\n');
};

const cleanLlmResponse = (response) => {
  if (!response) return '';
  const cleaned = response.replace(/^```[a-z]*\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  return ensureSemicolons(cleaned);
};

export async function POST(request) {
  try {
    const { config, step, documentText, importMode, existingSchema, schema, nodeQueries, existingDataContext } = await request.json();

    if (!config || !documentText) {
      return NextResponse.json({ error: 'Configuration or document is missing.' }, { status: 400 });
    }

    // --- Étape 1 : Génération du schéma ---
    if (step === 'generate_schema') {
        const criticalRule = `--- CRITICAL RULES FOR KUZU SCHEMA ---
1.  **Output Format**: Respond ONLY with the Cypher queries. Do not add any explanations, markdown, or comments. Each statement MUST end with a semicolon ';'.
2.  **NODE Table**: Every new NODE table MUST include 'id SERIAL' and 'PRIMARY KEY (id)'. Example: "CREATE NODE TABLE Person(id SERIAL, name STRING, PRIMARY KEY (id));".
3.  **REL Table**: REL tables MUST NOT include 'id SERIAL' or 'PRIMARY KEY (id)'. They define connections between nodes.
4.  **Relationship Syntax**: For REL tables, you MUST use the 'FROM TableName TO TableName' syntax. Example: "CREATE REL TABLE KNOWS(FROM Person TO Person, since DATE);" .
5.  **Data Types**: Use Kuzu-native types: STRING, INT64, DOUBLE, BOOLEAN, DATE, TIMESTAMP, etc.
6.  **REL TABLE Constraint**: Table names in 'FROM' and 'TO' clauses MUST refer to defined NODE TABLE names.`;

        let systemPrompt = '';
        if (importMode === 'append') {
            systemPrompt = `You are a Kuzu database designer. An existing schema is provided. Analyze a new document and generate ONLY the additional Kuzu Cypher queries for concepts NOT ALREADY defined in the existing schema.
- If no new tables are needed, respond with an empty string.
- Do NOT repeat or modify existing table definitions.
${criticalRule}`;
        } else {
            systemPrompt = `You are a Kuzu database designer. Based on the document, create a complete graph schema using Kuzu Cypher.
${criticalRule}`;
        }
        
        const userContent = `${importMode === 'append' ? `EXISTING SCHEMA:\n---\n${existingSchema}\n---\n\n` : ''}NEW DOCUMENT:\n---\n${documentText}\n---`;
        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        
        let finalSchema = '';
        for (let i = 0; i < MAX_RETRIES; i++) {
            const llmResponse = await callLLM(config, messages);
            const cleanedResponse = cleanLlmResponse(llmResponse);
            const reorderedSchema = reorderSchemaQueries(cleanedResponse);
            if (validateSchemaCypher(reorderedSchema)) {
                finalSchema = reorderedSchema;
                break;
            }
        }
        return NextResponse.json({ schema: finalSchema });
    }
    
    // --- Étape 2 : Génération des Nœuds ---
    if (step === 'generate_nodes') {
        if (!schema) return NextResponse.json({ error: 'Schema context is required.' }, { status: 400 });
        
        const systemPrompt = `You are a Kuzu data specialist. Your task is to generate Cypher queries to create nodes based on a document and a given schema.
--- CRITICAL RULES FOR NODE QUERIES ---
1.  **Output Format**: Respond ONLY with the Cypher queries. No explanations or markdown. Each statement MUST end with a semicolon ';'.
2.  **Use MERGE**: You MUST use 'MERGE' on a unique property (like a name or ID) to create nodes. This prevents duplicates.
3.  **Context Awareness (IMPORTANT)**: If provided with "EXISTING DATA CONTEXT", you MUST NOT generate MERGE queries for nodes that are already present in that context. Only create what is missing.
4.  **No Relationships**: Do NOT create relationships in this step. Only nodes.`;

        let userContent = `SCHEMA:\n\`\`\`cypher\n${schema}\n\`\`\`\n\nDOCUMENT:\n---\n${documentText}\n---`;

        if (importMode === 'append' && existingDataContext) {
            userContent += `\n\nEXISTING DATA CONTEXT FROM THE DATABASE:\n---\n${JSON.stringify(existingDataContext, null, 2)}\n---`;
        }

        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        
        let finalQueries = '';
        for (let i = 0; i < MAX_RETRIES; i++) {
            const llmResponse = await callLLM(config, messages);
            const cleanedResponse = cleanLlmResponse(llmResponse);
            if (validateNodeCypher(cleanedResponse)) {
                finalQueries = cleanedResponse;
                break;
            }
        }
        return NextResponse.json({ queries: finalQueries });
    }

    // --- Étape 3 : Génération des Relations ---
    if (step === 'generate_relationships') {
        if (!schema || !nodeQueries) return NextResponse.json({ error: 'Schema and node queries context are required.' }, { status: 400 });

        const systemPrompt = `You are a Kuzu data specialist. You will be given a schema, an original document, and Cypher queries that were used to create nodes. 
**Assume these nodes now exist in the database.**
Your only task is to write the relationship queries to connect them based on the information in the original document.

--- CRITICAL RULES FOR RELATIONSHIP QUERIES ---
1.  **Output Format**: Respond ONLY with the Cypher queries. No explanations or markdown. Each statement MUST end with a semicolon ';'.
2.  **Strict Pattern**: To create relationships, you MUST use the 'MATCH (a:Label), MATCH (b:Label), MERGE (a)-[:REL_TYPE]->(b)' pattern.
3.  **Find Nodes**: Use properties from the document to MATCH the correct source and destination nodes that were just created.
4.  **Context Awareness**: If provided with "EXISTING DATA CONTEXT", do NOT generate MERGE queries for relationships already present.
5.  **No Node Creation**: Do NOT create nodes here. Only connect the existing ones.

--- CORRECT PATTERN EXAMPLE ---
MATCH (a:Person {name: 'Alice'}) MATCH (b:Company {name: 'Acme Corp'}) MERGE (a)-[:WORKS_AT]->(b);`;

        let userContent = `SCHEMA:\n\`\`\`cypher\n${schema}\n\`\`\`\n\nNEW NODE:\n\`\`\`cypher\n${nodeQueries}\n\`\`\`\n\nORIGINAL DOCUMENT:\n---\n${documentText}\n---`;

        if (importMode === 'append' && existingDataContext) {
            userContent += `\n\nEXISTING DATA CONTEXT FROM THE DATABASE:\n---\n${JSON.stringify(existingDataContext, null, 2)}\n---`;
        }

        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }];
        
        let finalQueries = '';
        for (let i = 0; i < MAX_RETRIES; i++) {
            const llmResponse = await callLLM(config, messages);
            const cleanedResponse = cleanLlmResponse(llmResponse);
            if (validateRelationshipCypher(cleanedResponse)) {
                finalQueries = cleanedResponse;
                break;
            }
            if (i === MAX_RETRIES - 1) {
                console.warn("Relationship validation failed after retries. Returning last attempt.");
                finalQueries = cleanedResponse;
            }
        }
        return NextResponse.json({ queries: finalQueries });
    }

    return NextResponse.json({ error: 'Invalid step provided.' }, { status: 400 });

  } catch (error) {
    console.error("Error in /api/ai/import:", error);
    return NextResponse.json({ error: error.message || "Error communicating with the AI service." }, { status: 500 });
  }
}