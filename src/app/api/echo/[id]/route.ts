import { Hono } from 'hono';

const app = new Hono();

app.get('/echo/:id', (c) => {
  return c.json({
    method: 'GET',
    id: c.req.param('id'),
    query: c.req.query(),
  });
});

app.post('/echo/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  return c.json({
    method: 'POST',
    id: c.req.param('id'),
    query: c.req.query(),
    body,
  });
});

export default app;
