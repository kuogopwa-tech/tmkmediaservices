function normalizeBaseUrl(url) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function openAiCompatibleChat({ baseUrl, apiKey, model, messages }) {
  const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  // OpenRouter recommends these headers. They help with attribution and can avoid some policy blocks.
  if (normalizeBaseUrl(baseUrl).includes('openrouter.ai')) {
    const siteUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      '';
    const appName = process.env.APP_NAME || 'tmkmediaservices';
    if (siteUrl) headers['HTTP-Referer'] = siteUrl;
    headers['X-Title'] = appName;
  }

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

    // OpenAI-compatible endpoint (OpenRouter, etc.)
    const aiBaseUrl = process.env.AI_BASE_URL;
    if (provider === 'openai_compat' || aiBaseUrl) {
      const model = process.env.AI_MODEL || 'gpt-3.5-turbo';
      const apiKey = process.env.AI_API_KEY || '';
      const out = await openAiCompatibleChat({ baseUrl: aiBaseUrl, apiKey, model, messages });
      return res.status(200).json({ ok: true, content: out.content });
    }

    res.status(500).json({
      ok: false,
      error: 'No AI provider configured. Set AI_PROVIDER=openai_compat and AI_BASE_URL/AI_MODEL/AI_API_KEY.',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Chat failed' });
  }
};
