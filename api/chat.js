function normalizeBaseUrl(url) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function withTimeout(ms = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(resp, data) {
  const headerVal = Number(resp?.headers?.get?.('retry-after'));
  if (Number.isFinite(headerVal) && headerVal > 0) return Math.ceil(headerVal);

  const metaVal = Number(data?.error?.metadata?.retry_after_seconds);
  if (Number.isFinite(metaVal) && metaVal > 0) return Math.ceil(metaVal);

  const rawMetaVal = Number(data?.error?.metadata?.retry_after_seconds_raw);
  if (Number.isFinite(rawMetaVal) && rawMetaVal > 0) return Math.ceil(rawMetaVal);

  return 2;
}

async function openAiCompatibleChat({ baseUrl, apiKey, model, messages }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const url = `${normalizedBaseUrl}/chat/completions`;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (normalizedBaseUrl.includes('openrouter.ai')) {
    const siteUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      '';
    const appName = process.env.APP_NAME || 'tmkmediaservices';
    if (siteUrl) headers['HTTP-Referer'] = siteUrl;
    headers['X-Title'] = appName;
  }

  const { controller, timeout } = withTimeout(30000);
  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        stream: false,
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('AI provider request timed out. Please try again.');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    const netErr = new Error(`AI provider request failed: ${err.message}`);
    netErr.code = 'NETWORK';
    throw netErr;
  } finally {
    clearTimeout(timeout);
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(data?.error?.message || `AI provider error (HTTP ${resp.status})`);
    err.status = resp.status;
    err.providerData = data;
    err.retryAfterSeconds = parseRetryAfterSeconds(resp, data);
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content ?? '';
  return { content };
}

async function chatWithRetryAndFallback({ baseUrl, apiKey, messages, models }) {
  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log('[chat] provider attempt', { model, attempt });
        const out = await openAiCompatibleChat({ baseUrl, apiKey, model, messages });
        return { out, model, usedFallback: model !== models[0] };
      } catch (err) {
        lastError = err;
        const status = err?.status || 0;
        const providerMeta = err?.providerData?.error?.metadata || null;
        console.error('[chat] provider error', {
          model,
          attempt,
          status,
          message: err?.message,
          providerMeta,
        });

        if (status === 429 && attempt === 1) {
          const waitSeconds = Math.max(1, Number(err?.retryAfterSeconds || 2));
          console.warn('[chat] rate limited, retrying same model after delay', {
            model,
            waitSeconds,
          });
          await sleep(waitSeconds * 1000);
          continue;
        }

        break;
      }
    }
  }

  const finalStatus = lastError?.status || 500;
  if (finalStatus === 429) {
    const busyErr = new Error('AI provider is temporarily busy. Please try again shortly.');
    busyErr.status = 429;
    busyErr.retryAfterSeconds = lastError?.retryAfterSeconds || 2;
    throw busyErr;
  }

  throw new Error(lastError?.message || 'Chat failed');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: 'messages[] required' });
  }

  try {
    const provider = (process.env.AI_PROVIDER || 'openai_compat').toLowerCase();

    const aiBaseUrl = normalizeBaseUrl(
      process.env.BLACKBOX_BASE_URL ||
      process.env.AI_BASE_URL ||
      'https://api.blackbox.ai'
    );
    const apiKey = process.env.BLACKBOX_API_KEY || process.env.AI_API_KEY || '';

    const primaryModel =
      process.env.BLACKBOX_MODEL ||
      process.env.AI_MODEL ||
      'blackboxai/openai/gpt-4.1-mini';

    const fallbackModel = process.env.BLACKBOX_FALLBACK_MODEL || 'blackboxai/claude-sonnet-4';

    const isBlackboxProvider = aiBaseUrl.includes('api.blackbox.ai');

    const modelChain = isBlackboxProvider
      ? [primaryModel, fallbackModel].filter((v, i, arr) => !!v && arr.indexOf(v) === i)
      : [
          primaryModel,
          fallbackModel,
          'deepseek/deepseek-chat:free',
          'meta-llama/llama-3.3-8b-instruct:free',
        ].filter((v, i, arr) => !!v && arr.indexOf(v) === i);

    if (!provider || provider !== 'openai_compat') {
      return res.status(500).json({
        ok: false,
        error: 'AI chat not configured: set AI_PROVIDER=openai_compat.',
      });
    }

    if (!aiBaseUrl) {
      return res.status(500).json({
        ok: false,
        error: 'AI chat not configured: set BLACKBOX_BASE_URL (or AI_BASE_URL).',
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: 'AI chat not configured: set BLACKBOX_API_KEY (or AI_API_KEY).',
      });
    }

    const { out, model, usedFallback } = await chatWithRetryAndFallback({
      baseUrl: aiBaseUrl,
      apiKey,
      messages,
      models: modelChain,
    });

    return res.status(200).json({
      ok: true,
      content: out.content,
      meta: { model, usedFallback },
    });
  } catch (err) {
    console.error('Chat handler error:', err);
    const status = err?.status || 500;
    return res.status(status).json({
      ok: false,
      error: err.message || 'Chat failed',
      retrying: status === 429,
      retryAfterSeconds: err?.retryAfterSeconds || undefined,
    });
  }
};
