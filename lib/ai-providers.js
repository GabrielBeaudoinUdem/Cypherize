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

async function callMistral(config, messages) {
  const payload = {
    model: config.model,
    messages,
    temperature: 0.2,
    max_tokens: 2048,
    stream: false,
  };

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mistral API responded with status ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
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


export async function callLLM(config, messages) {
    const provider = config.provider;
    const providerConfig = config[provider];

    switch (provider) {
        case 'lmstudio':
            return callLMStudio(providerConfig, messages);
        case 'mistral':
            return callMistral(providerConfig, messages);
        // case 'openai':
        //     return callOpenAI(providerConfig, messages);
        // case 'claude':
        //     return callClaude(providerConfig, messages);
        // case 'gemini':
        //     return callGemini(providerConfig, messages);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}