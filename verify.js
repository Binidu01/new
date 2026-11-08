// verify.js (ESM)
// Run: node verify.js
// Checks the dist/ tree after `pnpm build` and prints a pass/fail table.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

let passed = 0;
let failed = 0;
const failures = [];

function fileExists(rel) {
  return fs.existsSync(path.join(DIST, ...rel.split('/')));
}

function readFile(rel) {
  try { return fs.readFileSync(path.join(DIST, ...rel.split('/')), 'utf8'); }
  catch { return null; }
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok    ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
    failures.push({ name, detail });
  }
}

function contains(rel, needle) {
  const content = readFile(rel);
  return content !== null && content.includes(needle);
}

function notContains(rel, needle) {
  const content = readFile(rel);
  return content !== null && !content.includes(needle);
}

console.log('\ndist/ exists:', fs.existsSync(DIST));

if (!fs.existsSync(DIST)) {
  console.error('dist/ does not exist — run `pnpm build` first.');
  process.exit(1);
}

console.log('\n── Static pages ──');
assert('dist/index.html exists', fileExists('index.html'));
assert('dist/about/index.html exists', fileExists('about/index.html'));
assert('dist/blog/index.html exists', fileExists('blog/index.html'));

console.log('\n── staticParams enumeration ──');
assert('dist/blog/hello/index.html exists', fileExists('blog/hello/index.html'));
assert('dist/blog/world/index.html exists', fileExists('blog/world/index.html'));
assert('dist/blog/hello/index.html has real SSR content', contains('blog/hello/index.html', 'post-ssr-hello'));
assert('dist/blog/hello/index.html has no shell marker', notContains('blog/hello/index.html', '__BINI_SHELL__'));
assert('dist/blog/world/index.html has real SSR content', contains('blog/world/index.html', 'post-ssr-world'));

console.log('\n── Shell for unmatched slugs ──');
assert('dist/blog/[slug]/index.html exists', fileExists('blog/[slug]/index.html'));
assert('dist/blog/[slug]/index.html has shell marker', contains('blog/[slug]/index.html', '__BINI_SHELL__'));

console.log('\n── prerender = false ──');
assert('dist/private/a/index.html NOT written', !fileExists('private/a/index.html'));
assert('dist/private/b/index.html NOT written', !fileExists('private/b/index.html'));
assert('dist/private/[slug]/index.html exists', fileExists('private/[slug]/index.html'));
assert('dist/private/[slug]/index.html has shell marker', contains('private/[slug]/index.html', '__BINI_SHELL__'));
assert('dist/private/[slug]/index.html has no private-shell content', notContains('private/[slug]/index.html', 'private-shell-a'));

console.log('\n── Crawl fallback ──');
assert('dist/blog/extra/index.html exists (crawled from /blog)', fileExists('blog/extra/index.html'));
assert('dist/docs/intro/index.html exists (crawled from /about)', fileExists('docs/intro/index.html'));
assert('dist/docs/intro/index.html has real SSR content', contains('docs/intro/index.html', 'doc-ssr-intro'));
assert('dist/docs/[slug]/index.html exists (shell)', fileExists('docs/[slug]/index.html'));

console.log('\n── clientOnly shell ──');
assert('dist/dashboard/index.html exists', fileExists('dashboard/index.html'));
assert('dist/dashboard/index.html has shell marker', contains('dashboard/index.html', '__BINI_SHELL__'));

console.log('\n── 404 ──');
assert('dist/404.html exists', fileExists('404.html'));

console.log('\n── API bundle ──');
assert('dist/api/index.mjs exists', fileExists('api/index.mjs'));
assert('dist/api/index.mjs uses new Hono() (Form A dispatcher)', contains('api/index.mjs', 'new Hono'));

console.log('\n── Client bundle privacy ──');
const assetsDir = path.join(DIST, 'assets');
const jsDir = path.join(DIST, 'js');
function scanDirForPattern(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  const hits = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
    if (content.includes(pattern)) hits.push(entry.name);
  }
  return hits;
}
const secretHits = [...scanDirForPattern(assetsDir, 'test-secret'), ...scanDirForPattern(jsDir, 'test-secret')];
const publicHits = [...scanDirForPattern(assetsDir, 'example.com'), ...scanDirForPattern(jsDir, 'example.com')];
assert('SMTP_PASS (secret) NOT in client bundle', secretHits.length === 0, secretHits.length > 0 ? `found in ${secretHits.join(', ')}` : '');
assert('BINI_API_URL (prefixed) present in client bundle', publicHits.length > 0);

console.log('\n── Summary ──');
console.log(`  ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
  process.exit(1);
}