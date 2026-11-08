import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { getEnv, requireEnv, checkEnv } from 'bini-env';

const app = new Hono();

app.all('/health', (c) => {
  const honoVal = env(c)['SMTP_PASS'];
  const biniVal = getEnv(c, 'SMTP_PASS');
  const apiUrl = getEnv(c, 'BINI_API_URL');
  const health = checkEnv(c, ['SMTP_PASS', 'BINI_API_URL']);

  let required = null;
  let requiredError = null;
  try {
    required = requireEnv(c, 'SMTP_PASS');
  } catch (err) {
    requiredError = (err as Error).message;
  }

  return c.json({
    ok: health.ok,
    missing: health.missing,
    honoVal,
    biniVal,
    apiUrl,
    agree: honoVal === biniVal,
    required,
    requiredError,
    params: c.req.param(),
    query: c.req.query(),
  });
});

export default app;
