import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

async function findHtmlFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findHtmlFiles(absolutePath));
    if (entry.isFile() && entry.name === 'index.html') files.push(absolutePath);
  }

  return files.sort();
}

test('every page includes one consent stylesheet, script, and settings link', async () => {
  const files = await findHtmlFiles();
  assert.equal(files.length, 18);

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    assert.equal((html.match(/\/assets\/cookie-consent\.css/g) || []).length, 1, file);
    assert.equal((html.match(/\/assets\/cookie-consent\.js/g) || []).length, 1, file);
    assert.equal((html.match(/data-cookie-settings/g) || []).length, 1, file);
    assert.equal((html.match(/googletagmanager\.com\/gtag\/js/g) || []).length, 0, file);
  }
});

test('legal pages describe consent-gated analytics without obsolete claims', async () => {
  const cookiePolicy = await readFile(path.join(root, 'cookiepolitik/index.html'), 'utf8');
  const privacyPolicy = await readFile(path.join(root, 'privatlivspolitik/index.html'), 'utf8');

  assert.match(cookiePolicy, /Google Analytics/);
  assert.match(cookiePolicy, /G-130SMNH86Q/);
  assert.match(cookiePolicy, /Cookieindstillinger/);
  assert.doesNotMatch(cookiePolicy, /anvender på nuværende tidspunkt heller ikke cookie-baserede statistik-/);
  assert.doesNotMatch(privacyPolicy, /På nuværende tidspunkt anvender Carupgrade ikke cookies/);
});

test('homepage badge names the mobile workshop coverage areas', async () => {
  const homepage = await readFile(path.join(root, 'index.html'), 'utf8');

  assert.match(homepage, /<div class="hero-badge">Mobilt værksted - Sjælland og Jylland<\/div>/);
  assert.doesNotMatch(homepage, /Mobilt værksted med erfarne mekanikere/);
});

test('homepage hero text states coverage in Jutland and Zealand', async () => {
  const homepage = await readFile(path.join(root, 'index.html'), 'utf8');

  assert.match(homepage, /Vi reparerer biler i både Jylland og på Sjælland\./);
});

test('about page contains the approved personal story and SEO metadata', async () => {
  const about = await readFile(path.join(root, 'om-os/index.html'), 'utf8');

  assert.match(about, /<title>[^<]*(CarUpgrade|Om Os)[^<]*<\/title>/);
  assert.match(about, /<meta name="description" content="[^"]+">/);
  assert.match(about, /<link rel="canonical" href="https:\/\/carupgrade\.dk\/om-os\/">/);
  assert.match(about, /"@type": "AboutPage"/);
  assert.match(about, /Fra København til Jylland – CarUpgrade er vokset med opgaven/);
  assert.match(about, /Jeg startede CarUpgrade som mekaniker i København i 2023\./);
  assert.match(about, /Vamdrup/);
  assert.match(about, /større del af Jylland/);
  assert.match(about, /aria-current="page">Om Os<\/a>/);
});

test('main navigation places Om Os between Reparationer and FAQ', async () => {
  const files = await findHtmlFiles();

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const nav = html.match(/<nav[^>]*(?:id="navbar"|class="topbar")[\s\S]*?<\/nav>/)?.[0];
    if (!nav || !/Reparationer/.test(nav) || !/FAQ/.test(nav)) continue;
    assert.match(nav, /Reparationer[\s\S]*?href="\/om-os\/"[^>]*>Om Os<\/a>[\s\S]*?FAQ/, file);
  }
});

test('FAQ pages describe service coverage in Jutland and Zealand', async () => {
  for (const directory of ['FAQ', 'faq']) {
    const html = await readFile(path.join(root, directory, 'index.html'), 'utf8');

    assert.equal((html.match(/Hvor reparerer I biler\?/g) || []).length, 2, directory);
    assert.match(html, /Vi reparerer biler i både Jylland og på Sjælland\./);
  }
});

test('consent stylesheet contains responsive and keyboard-focus states', async () => {
  const css = await readFile(path.join(root, 'assets/cookie-consent.css'), 'utf8');
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /bottom:\s*0/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media/);
});
