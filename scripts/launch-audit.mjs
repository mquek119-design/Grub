import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = new URL(process.argv[2] ?? 'https://grubhouse.uk');
const browser = await chromium.launch();
const context = await browser.newContext();
const results = { base: base.origin, checkedAt: new Date().toISOString(), pages: [], links: [], assets: [], limitations: ['Signed-out audit only. Protected forms and real email delivery require a session. Secret scan covers downloaded public scripts only; it is not proof that every deployed bundle is safe.'] };
const links = new Set();
const scripts = new Set();
try {
  for (const path of ['/welcome', '/login', '/onboarding/signup', '/privacy', '/terms', '/robots.txt', '/sitemap.xml', '/opengraph-image']) {
    const response = await context.request.get(new URL(path, base).href);
    const entry = { path, status: response.status(), url: response.url(), contentType: response.headers()['content-type'] };
    if (entry.contentType?.includes('text/html')) {
      const page = await context.newPage();
      await page.goto(new URL(path, base).href);
      entry.title = await page.title();
      entry.description = await page.locator('meta[name="description"]').getAttribute('content');
      entry.ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      entry.fields = await page.locator('input:not([type=hidden]), textarea, select').evaluateAll(nodes => nodes.map(n => ({ type: n.type, name: n.name, required: n.required, labelled: Boolean(n.labels?.length || n.getAttribute('aria-label') || n.getAttribute('aria-labelledby')), describedBy: n.getAttribute('aria-describedby') })));
      for (const href of await page.locator('a[href]').evaluateAll(nodes => nodes.map(n => n.href))) {
        const url = new URL(href);
        if (url.origin === base.origin && !url.pathname.startsWith('/auth/')) links.add(url.href);
      }
      for (const src of await page.locator('script[src]').evaluateAll(nodes => nodes.map(n => n.src))) scripts.add(src);
      await page.close();
    } else if (path === '/sitemap.xml' || path === '/robots.txt') {
      entry.body = await response.text();
    }
    results.pages.push(entry);
  }
  for (const url of links) {
    const response = await context.request.get(url);
    results.links.push({ url, status: response.status(), destination: response.url() });
  }
  for (const url of scripts) {
    const response = await context.request.get(url);
    const text = await response.text();
    // Report signatures only, never matched credential values.
    const signatures = [/sb_secret_[A-Za-z0-9_-]{10,}/, /-----BEGIN (?:RSA )?PRIVATE KEY-----/, /sk_live_[A-Za-z0-9]{16,}/];
    results.assets.push({ url, status: response.status(), secretSignatureFound: signatures.some(pattern => pattern.test(text)) });
  }
} finally { await browser.close(); }
await mkdir('.accessibility-audit', { recursive: true });
await writeFile('.accessibility-audit/launch.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.pages.some(p => p.status !== 200) || results.links.some(p => p.status >= 400) || results.assets.some(a => a.secretSignatureFound)) process.exitCode = 1;
