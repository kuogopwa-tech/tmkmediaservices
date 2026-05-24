function normalizeBaseUrl(url) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function openAiCompatibleChat({ baseUrl, apiKey, model, messages }) {
  const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      stream: false,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error?.message || `AI request failed (${resp.status})`);
  }

  const content = data?.choices?.[0]?.message?.content ?? '';
  return { content };
}

async function ollamaChat({ baseUrl, model, messages }) {
  const url = `${normalizeBaseUrl(baseUrl)}/api/chat`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || `Ollama request failed (${resp.status})`);
  }

  const content = data?.message?.content ?? '';
  return { content };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] required' });
  }

  try {
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();

    // Option A: OpenAI-compatible local servers (LM Studio, vLLM, Ollama OpenAI compat, etc.)
    const aiBaseUrl = process.env.AI_BASE_URL;
    if (provider === 'openai_compat' || (aiBaseUrl && provider !== 'ollama')) {
      const model = process.env.AI_MODEL || 'gpt-3.5-turbo';
      const apiKey = process.env.AI_API_KEY || '';
      const out = await openAiCompatibleChat({ baseUrl: aiBaseUrl, apiKey, model, messages });
      return res.status(200).json({ ok: true, content: out.content });
    }

    // Option B: Ollama native API
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
    if (provider === 'ollama' || ollamaBaseUrl) {
      const out = await ollamaChat({ baseUrl: ollamaBaseUrl, model: ollamaModel, messages });
      return res.status(200).json({ ok: true, content: out.content });
    }

    res.status(500).json({
      ok: false,
      error: 'No AI provider configured. Set AI_PROVIDER + AI_BASE_URL/AI_MODEL (OpenAI-compatible) or OLLAMA_BASE_URL/OLLAMA_MODEL.',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Chat failed' });
  }
};

