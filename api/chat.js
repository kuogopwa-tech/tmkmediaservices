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

  const { controller, timeout } = withTimeout(30000);
  let resp;
  try {
    const __CHAT_TEST_MODE__ = String(process.env.CHAT_TEST_MODE || '').trim();
    if (__CHAT_TEST_MODE__ === 'FORCE_429') {
      const forcedErr = new Error('AI provider is temporarily busy. Please try again shortly.');
      forcedErr.status = 429;
      forcedErr.retryAfterSeconds = 2;
      throw forcedErr;
    }
    if (__CHAT_TEST_MODE__ === 'FORCE_TIMEOUT') {
      const forcedErr = new Error('AI provider request timed out. Please try again.');
      forcedErr.code = 'TIMEOUT';
      throw forcedErr;
    }
    if (
      __CHAT_TEST_MODE__ === 'FORCE_PRIMARY_FAIL' &&
      model === String(process.env.BLACKBOX_MODEL || '').trim()
    ) {
      const forcedErr = new Error('Forced primary failure for fallback test');
      forcedErr.status = 500;
      throw forcedErr;
    }

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
    if (Number(err?.status) === 429) {
      throw err;
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
    const blackboxBaseUrl = normalizeBaseUrl(process.env.BLACKBOX_BASE_URL || '');
    const blackboxApiKey = String(process.env.BLACKBOX_API_KEY || '').trim();
    const primaryModel = String(process.env.BLACKBOX_MODEL || '').trim();
    const fallbackModel = String(process.env.BLACKBOX_FALLBACK_MODEL || '').trim();

    if (!blackboxBaseUrl) {
      return res.status(500).json({
        ok: false,
        error: 'Chat not configured: missing BLACKBOX_BASE_URL.',
      });
    }

    if (!blackboxApiKey) {
      return res.status(500).json({
        ok: false,
        error: 'Chat not configured: missing BLACKBOX_API_KEY.',
      });
    }

    if (!primaryModel) {
      return res.status(500).json({
        ok: false,
        error: 'Chat not configured: missing BLACKBOX_MODEL.',
      });
    }

    if (!fallbackModel) {
      return res.status(500).json({
        ok: false,
        error: 'Chat not configured: missing BLACKBOX_FALLBACK_MODEL.',
      });
    }

    const modelChain = [primaryModel, fallbackModel].filter(
      (v, i, arr) => !!v && arr.indexOf(v) === i
    );

    const { out, model, usedFallback } = await chatWithRetryAndFallback({
      baseUrl: blackboxBaseUrl,
      apiKey: blackboxApiKey,
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
