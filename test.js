// test.js (ESM)
// Run: node test.js
// Writes the fixture into <project-root>/src/app and creates <project-root>/.env if missing.
// Re-run safely: overwrites only files this script creates.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(ROOT, 'src', 'app');

if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  console.error(`Expected package.json in ${ROOT}`);
  console.error('test.js must live in the project root next to package.json.');
  process.exit(1);
}

console.log('project root:', ROOT);
console.log('writing to :', APP);

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(rel, contents) {
  const full = path.join(APP, ...rel.split('/'));
  mkdirp(path.dirname(full));
  fs.writeFileSync(full, contents, 'utf8');
  console.log('wrote', path.relative(ROOT, full));
}

function writeRoot(rel, contents, { overwrite = false } = {}) {
  const full = path.join(ROOT, rel);
  if (!overwrite && fs.existsSync(full)) {
    console.log('skip (exists)', rel);
    return;
  }
  mkdirp(path.dirname(full));
  fs.writeFileSync(full, contents, 'utf8');
  console.log('wrote', rel);
}

// ─── Layout ──────────────────────────────────────────────────────────────────

write('layout.tsx', `import { Link, Outlet } from 'react-router-dom';

export const metadata = {
  title: { default: 'Bini Test', template: '%s · Bini Test' },
  description: 'Fixture for testing bini-router / bini-ssg / bini-env / bini-server / bini-deploy',
};

export default function RootLayout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> · <Link to="/about">About</Link> ·{' '}
        <Link to="/blog">Blog</Link> · <Link to="/dashboard">Dashboard</Link> ·{' '}
        <Link to="/docs/intro">Docs</Link> · <Link to="/private/a">Private A</Link>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
`);

// ─── Static pages ────────────────────────────────────────────────────────────

write('page.tsx', `export const metadata = { title: 'Home' };

export default function Home() {
  return (
    <section data-route="/" data-marker="home-ssr">
      <h1>Home</h1>
      <p>This page is statically prerendered. If you can read this without JS, SSG worked.</p>
    </section>
  );
}
`);

write('about/page.tsx', `export const metadata = { title: 'About' };

export default function About() {
  return (
    <section data-route="/about" data-marker="about-ssr">
      <h1>About</h1>
      <p>Another static page.</p>
      <p>
        Link to a dynamic route without staticParams:{' '}
        <a href="/docs/intro">/docs/intro</a> (this URL should be crawled and prerendered).
      </p>
    </section>
  );
}
`);

// ─── Dashboard: has a loader → clientOnly → shell ────────────────────────────

write('dashboard/page.tsx', `import { useLoaderData } from 'react-router-dom';

export const metadata = { title: 'Dashboard' };

export async function loader() {
  return { generatedAt: new Date().toISOString() };
}

export default function Dashboard() {
  const { generatedAt } = useLoaderData();
  return (
    <section data-route="/dashboard" data-marker="dashboard-shell">
      <h1>Dashboard</h1>
      <p>This page has a loader, so it should be served as a CSR shell.</p>
      <p>Loader ran at: {generatedAt}</p>
    </section>
  );
}
`);

// ─── Blog index ──────────────────────────────────────────────────────────────

write('blog/page.tsx', `export const metadata = { title: 'Blog' };

const POSTS = [
  { slug: 'hello', title: 'Hello' },
  { slug: 'world', title: 'World' },
  { slug: 'extra', title: 'Extra (no staticParams entry)' },
];

export default function BlogIndex() {
  return (
    <section data-route="/blog" data-marker="blog-index-ssr">
      <h1>Blog</h1>
      <ul>
        {POSTS.map((p) => (
          <li key={p.slug}><a href={\`/blog/\${p.slug}\`}>{p.title}</a></li>
        ))}
      </ul>
    </section>
  );
}
`);

// ─── Blog post: staticParams enumerates 'hello' and 'world' ─────────────────

write('blog/[slug]/page.tsx', `import { useParams } from 'react-router-dom';

export const metadata = { title: 'Post' };

export async function staticParams() {
  return [{ slug: 'hello' }, { slug: 'world' }];
}

export default function Post() {
  const { slug } = useParams();
  return (
    <section data-route={\`/blog/\${slug}\`} data-marker={\`post-ssr-\${slug}\`}>
      <h1>Post: {slug}</h1>
      <p>This page was prerendered from staticParams.</p>
    </section>
  );
}
`);

// ─── Docs: no staticParams, discovered via crawl from /about ─────────────────

write('docs/[slug]/page.tsx', `import { useParams } from 'react-router-dom';

export const metadata = { title: 'Docs' };

export default function Doc() {
  const { slug } = useParams();
  return (
    <section data-route={\`/docs/\${slug}\`} data-marker={\`doc-ssr-\${slug}\`}>
      <h1>Doc: {slug}</h1>
      <p>This page has no staticParams. It should be prerendered if a page links to it.</p>
    </section>
  );
}
`);

// ─── Private: staticParams + prerender = false → shell only ──────────────────

write('private/[slug]/page.tsx', `import { useParams } from 'react-router-dom';

export const prerender = false;

export const metadata = { title: 'Private' };

export async function staticParams() {
  return [{ slug: 'a' }, { slug: 'b' }];
}

export default function Private() {
  const { slug } = useParams();
  return (
    <section data-route={\`/private/\${slug}\`} data-marker={\`private-shell-\${slug}\`}>
      <h1>Private: {slug}</h1>
      <p>prerender = false wins. This page should ship as a shell.</p>
    </section>
  );
}
`);

// ─── API: Form A (Hono app) — health ────────────────────────────────────────

write('api/health/route.ts', `import { Hono } from 'hono';
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
`);

// ─── API: Form A (Hono app) — echo with param ───────────────────────────────

write('api/echo/[id]/route.ts', `import { Hono } from 'hono';

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
`);

// ─── .env ──────────────────────────────────────────────────────────────────

writeRoot('.env', [
  'SMTP_PASS=test-secret',
  'BINI_API_URL=https://example.com',
  'PORT=3000',
  '',
].join('\n'));

// ─── Done ──────────────────────────────────────────────────────────────────

console.log('');
console.log('Done. Next:');
console.log('  1. pnpm build');
console.log('  2. node verify.js       ← structural checks');
console.log('  3. pnpm dev');
console.log('  4. curl http://localhost:3000/api/health');
console.log('  5. pnpm start');