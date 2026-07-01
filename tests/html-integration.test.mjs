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

const localPages = [
  'mobil-mekaniker-vamdrup',
  'mobil-mekaniker-jylland',
  'mobil-mekaniker-kolding',
  'mobil-mekaniker-haderslev',
  'mobil-mekaniker-vejen',
  'mobil-mekaniker-fredericia',
  'mobil-mekaniker-vejle',
  'mobil-mekaniker-esbjerg'
];

async function readPage(directory) {
  return readFile(path.join(root, directory, 'index.html'), 'utf8');
}

function readGraph(html) {
  const source = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'page must contain JSON-LD');
  const data = JSON.parse(source);
  return data['@graph'] || [data];
}

test('every page includes one consent stylesheet, script, and settings link', async () => {
  const files = await findHtmlFiles();
  assert.equal(files.length, 26);

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
  assert.match(homepage, /<meta name="description" content="[^"]*Sjælland og Jylland[^"]*">/);
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

test('full navigation collapses before labels can wrap at tablet widths', async () => {
  const files = await findHtmlFiles();

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const nav = html.match(/<nav[^>]*id="navbar"[\s\S]*?<\/nav>/)?.[0];
    if (!nav || !/Reparationer/.test(nav) || !/FAQ/.test(nav)) continue;
    assert.match(html, /@media \(max-width: 1120px\)[\s\S]*?\.nav-links \{ display: none; \}/, file);
  }
});

test('FAQ pages describe service coverage in Jutland and Zealand', async () => {
  for (const directory of ['FAQ', 'faq']) {
    const html = await readFile(path.join(root, directory, 'index.html'), 'utf8');

    assert.equal((html.match(/Hvor reparerer I biler\?/g) || []).length, 2, directory);
    assert.match(html, /Vi reparerer biler i både Jylland og på Sjælland\./);
  }
});

test('Jylland local pages have unique self-canonicals and Vamdrup provider schema', async () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const directory of localPages) {
    const html = await readPage(directory);
    const canonical = `https://carupgrade.dk/${directory}/`;
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    const graph = readGraph(html);
    const service = graph.find((entity) => entity['@type'] === 'Service');

    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`), directory);
    assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/, directory);
    assert.ok(title && !titles.has(title), `${directory} title must be unique`);
    assert.ok(description && !descriptions.has(description), `${directory} description must be unique`);
    assert.equal(service.provider['@id'], 'https://carupgrade.dk/#location-vamdrup', directory);
    assert.match(html, /data-cookie-settings/, directory);
    titles.add(title);
    descriptions.add(description);
  }
});

test('Vamdrup branch schema contains the approved physical business facts', async () => {
  const graph = readGraph(await readPage('mobil-mekaniker-vamdrup'));
  const branch = graph.find((entity) => entity['@id'] === 'https://carupgrade.dk/#location-vamdrup');

  assert.ok(branch);
  assert.ok([branch['@type']].flat().includes('AutoRepair'));
  assert.equal(branch.telephone, '+45 31 14 77 37');
  assert.deepEqual(branch.address, {
    '@type': 'PostalAddress',
    streetAddress: 'Gåskærvej 12',
    postalCode: '6580',
    addressLocality: 'Vamdrup',
    addressCountry: 'DK'
  });
  assert.deepEqual(branch.openingHours, ['Mo-Sa 09:00-19:00']);
  assert.equal(branch.parentOrganization['@id'], 'https://carupgrade.dk/#organization');
});

test('Værløse and Vamdrup have separate stable structured-data identities', async () => {
  const homepageGraph = readGraph(await readPage('.'));
  const ids = new Set(homepageGraph.map((entity) => entity['@id']).filter(Boolean));

  assert.ok(ids.has('https://carupgrade.dk/#organization'));
  assert.ok(ids.has('https://carupgrade.dk/#location-vaerloese'));
  assert.ok(ids.has('https://carupgrade.dk/#location-vamdrup'));
});

test('Jylland hub visibly links every local coverage page', async () => {
  const html = await readPage('mobil-mekaniker-jylland');

  for (const directory of localPages.filter((page) => page !== 'mobil-mekaniker-jylland')) {
    assert.match(html, new RegExp(`href="/${directory}/"`), directory);
  }
});

test('sitemap contains each local canonical exactly once', async () => {
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');

  for (const directory of localPages) {
    const canonical = `https://carupgrade.dk/${directory}/`;
    assert.equal((sitemap.match(new RegExp(canonical, 'g')) || []).length, 1, directory);
  }
});

test('structured data no longer uses the ambiguous business identity', async () => {
  for (const file of await findHtmlFiles()) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /https:\/\/carupgrade\.dk\/#business/, file);
  }
});

test('main service pages provide visible entry points to Jylland coverage', async () => {
  for (const directory of ['.', 'mobil-mekaniker', 'mobilt-vaerksted']) {
    const html = await readPage(directory);
    assert.match(html, /href="\/mobil-mekaniker-jylland\/"/, directory);
    assert.match(html, /href="\/mobil-mekaniker-vamdrup\/"/, directory);
  }
});

test('consent stylesheet contains responsive and keyboard-focus states', async () => {
  const css = await readFile(path.join(root, 'assets/cookie-consent.css'), 'utf8');
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /bottom:\s*0/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media/);
});
