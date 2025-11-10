import { NextResponse } from 'next/server';
import { getDbSchema, executeCypherQuery } from '../../../lib/kuzu-db';

async function callLMStudio(config, messages) {
  const payload = { model: config.model, messages, temperature: 0.2, stream: false };
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`LM Studio API responded with status ${response.status}.`);
  }
  const data = await response.json();
  return data.choices[0]?.message?.content;
}

async function callOpenAI(config, messages) {
  const payload = { model: config.model, messages, temperature: 0.2, stream: false };
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`OpenAI API responded with status ${response.status}.`);
  }
  const data = await response.json();
  return data.choices[0]?.message?.content;
}

async function callClaude(config, messages) {
  const systemPrompt = messages.find(m => m.role === 'system')?.content || "";
  const userMessages = messages.filter(m => m.role !== 'system');
  const payload = {
    model: config.model,
    system: systemPrompt,
    messages: userMessages,
    max_tokens: 2048,
    temperature: 0.2,
  };
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Claude API responded with status ${response.status}.`);
  }
  const data = await response.json();
  return data.content[0]?.text;
}

async function callGemini(config, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  const contents = messages.map(m => ({
    role: m.role === 'system' ? 'user' : m.role,
    parts: [{ text: m.content }],
  }));

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API responded with status ${response.status}: ${text}`);
  }

  const data = await response.json();

  const textResponse =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.output ||
    data?.candidates?.[0]?.text ||
    null;

  if (!textResponse) {
    throw new Error(`Unexpected Gemini response format: ${JSON.stringify(data)}`);
  }

  return textResponse;
}


async function callLLM(config, messages) {
    const provider = config.provider;
    const providerConfig = config[provider];

    switch (provider) {
        case 'lmstudio':
            return callLMStudio(providerConfig, messages);
        case 'openai':
            return callOpenAI(providerConfig, messages);
        case 'claude':
            return callClaude(providerConfig, messages);
        case 'gemini':
            return callGemini(providerConfig, messages);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}


export async function POST(request) {
  try {
    const { config, prompt, confirmedQuery } = await request.json();

    if (!config || !config.provider) {
      return NextResponse.json({ error: 'AI provider configuration is missing.' }, { status: 400 });
    }

    if (confirmedQuery) {
        try {
            await executeCypherQuery(confirmedQuery);
            return NextResponse.json({ type: 'none', text: "The modification was successful.", success: true });
        } catch(e) {
            return NextResponse.json({ type: 'error', text: `${e.message}`, success: false });
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

    const planningResponseContent = await callLLM(config, planningMessages);
    let plan;
    try {
        const cleaned = planningResponseContent
          .replace(/```json\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();

        plan = JSON.parse(cleaned);

        if (!plan.intent || !plan.query)
            throw new Error("Invalid JSON format from LLM.");
    } catch (e) {
        console.error("Error parsing LLM planning response:", e, `\nContent: ${planningResponseContent}`);
        return NextResponse.json({
            type: 'answer',
            text: "Sorry, I couldn't generate a valid query. Please try rephrasing.",
            success: false
        });
    }
    if (plan.intent === 'write') {
      return NextResponse.json({ type: 'confirmation', query: plan.query });
    }

    if (plan.intent === 'read') {
      let queryResult;
      try {
          queryResult = await executeCypherQuery(plan.query);
      } catch (e) {
          return NextResponse.json({ type: 'answer', text: `I tried to execute a query, but an error occurred: ${e.message}`, success: false });
      }

      const finalAnswerMessages = [
        {
          role: 'system',
          content: "You are a helpful assistant. Based on the user's original question and the following JSON data, provide a clear and concise answer in natural language. Do not show the JSON data to the user."
        },
        { role: 'user', content: `My question was: "${prompt}"\n\nHere is the data obtained:\n${JSON.stringify(queryResult, null, 2)}` }
      ];

      const answerText = await callLLM(config, finalAnswerMessages) || "I was unable to formulate a response.";

      return NextResponse.json({ type: 'answer', text: answerText, query: plan.query, data: queryResult, success: true });
    }

    return NextResponse.json({ type: 'answer', text: `Unrecognized intent: ${plan.intent}`, success: false });

  } catch (error) {
    console.error("Internal error in /api/ai:", error);
    return NextResponse.json({ error: error.message || "Error communicating with the AI service." }, { status: 500 });
  }
}