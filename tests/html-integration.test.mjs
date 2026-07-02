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
    assert.equal(files.length, 27);

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
  assert.match(homepage, /<meta name="description" content="[^"]*Sjælland og i Jylland[^"]*">/);
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

test('review navigation links use the dedicated route', async () => {
  for (const file of await findHtmlFiles()) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /href="\/?#anmeldelser"/, file);

    if (/Anmeldelser/.test(html)) {
      assert.match(html, /href="\/anmeldelser\/"[^>]*>Anmeldelser<\/a>/, file);
    }
  }
});

test('full navigation places Anmeldelser between Reparationer and Om Os', async () => {
  for (const file of await findHtmlFiles()) {
    const html = await readFile(file, 'utf8');
    const nav = html.match(/<nav[^>]*(?:id="navbar"|class="topbar")[\s\S]*?<\/nav>/)?.[0];
    if (!nav || !/Reparationer/.test(nav) || !/Om Os/.test(nav)) continue;

    assert.match(
      nav,
      /Reparationer[\s\S]*?href="\/anmeldelser\/"[^>]*>Anmeldelser<\/a>[\s\S]*?href="\/om-os\/"[^>]*>Om Os<\/a>/,
      file
    );
  }
});

test('homepage no longer renders review cards and uses current Trustpilot facts', async () => {
  const homepage = await readPage('.');

  assert.doesNotMatch(homepage, /<section[^>]*id="anmeldelser"/);
  assert.doesNotMatch(homepage, /class="review-card"/);
  assert.doesNotMatch(homepage, />3[,.]8(?:<|★)/);
  assert.doesNotMatch(homepage, /2 anmeldelser/);
  assert.match(homepage, />4\.0★</);
  assert.match(homepage, /why-big-stat">4\.0<span>★<\/span>/);
});

test('homepage Trustpilot panel states coverage in both Zealand and Jutland', async () => {
  const homepage = await readPage('.');
  const trustpilotPanel = homepage.match(/<div class="why-visual"[\s\S]*?<\/section>/)?.[0];

  assert.ok(trustpilotPanel);
  assert.match(trustpilotPanel, /Sjælland[\s\S]*?(?:&amp;|og)[\s\S]*?Jylland/);
  assert.match(trustpilotPanel, /<small>Dækning<\/small>/);
});

test('reviews page publishes the approved metadata and Trustpilot summary', async () => {
  const reviews = await readPage('anmeldelser');

  assert.match(reviews, /<title>[^<]*Anmeldelser[^<]*CarUpgrade[^<]*<\/title>/);
  assert.match(reviews, /<meta name="description" content="[^"]+">/);
  assert.match(reviews, /<link rel="canonical" href="https:\/\/carupgrade\.dk\/anmeldelser\/">/);
  assert.match(reviews, /"@type": "WebPage"/);
  assert.match(reviews, /"url": "https:\/\/carupgrade\.dk\/anmeldelser\/"/);
  assert.match(reviews, /4,0/);
  assert.match(reviews, /4 anmeldelser/);
  assert.doesNotMatch(reviews, /AggregateRating/);
});

test('reviews page renders all four approved reviews', async () => {
  const reviews = await readPage('anmeldelser');

  assert.equal((reviews.match(/class="review-card"/g) || []).length, 4);
  for (const expected of [
    'Intl',
    'Super tilfreds!',
    'Hurtig, professionel og en meget behagelig service.',
    'Sofie Jensen',
    'Har brugt ham flere gange og er altid tilfreds',
    'Leif vester',
    'Vild god service',
    'Søren',
    'God og hurtig reparation'
  ]) {
    assert.match(reviews, new RegExp(expected), expected);
  }
});

test('reviews page omits the standalone CTA band and retains the protected contact form', async () => {
  const reviews = await readPage('anmeldelser');
  const formIndex = reviews.indexOf('id="contactForm"');

  assert.doesNotMatch(reviews, /class="conversion-cta"/);
  assert.doesNotMatch(reviews, /Klar til næste skridt\?/);
  assert.doesNotMatch(reviews, /Få samme gode service/);
  assert.ok(formIndex > -1);
  assert.match(reviews, /<form[^>]*id="contactForm"[^>]*action="\/api\/contact"[^>]*method="POST"/);
  assert.match(reviews, /name="name"[^>]*required/);
  assert.match(reviews, /name="email"[^>]*required/);
  assert.match(reviews, /name="message"[^>]*required/);
  assert.match(reviews, /name="website"[^>]*tabindex="-1"/);
  assert.match(reviews, /id="turnstileWidget"/);
  assert.match(reviews, /turnstile\.render/);
  assert.match(reviews, /fetch\(form\.action/);
  assert.match(reviews, /class="form-status"[^>]*role="status"[^>]*aria-live="polite"/);
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

test('Om Os uses the same primary navigation presentation as FAQ', async () => {
  const about = await readPage('om-os');

  assert.match(about, /#navbar\s*\{[\s\S]*?--red:\s*#D91B38;[\s\S]*?--gray-light:\s*#bbb;[\s\S]*?position:\s*fixed;[\s\S]*?z-index:\s*1000;/);
  assert.match(about, /\.nav-logo img\s*\{[^}]*width:\s*138px;/);
  assert.match(about, /\.nav-links\s*\{[^}]*gap:\s*2rem;/);
  assert.match(about, /\.nav-links a\s*\{[\s\S]*?font-size:\s*0\.85rem;[\s\S]*?font-weight:\s*500;/);
  assert.match(about, /\.nav-cta\s*\{[\s\S]*?padding:\s*0\.5rem 1\.25rem;/);
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
  const vamdrupPage = await readPage('mobil-mekaniker-vamdrup');
  const graph = readGraph(vamdrupPage);
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
  assert.deepEqual(branch.openingHours, ['Mo-Fr 09:00-19:00']);
  assert.equal(branch.parentOrganization['@id'], 'https://carupgrade.dk/#organization');
  assert.match(vamdrupPage, /Mandag–fredag 09–19/);
  assert.match(vamdrupPage, /Weekender efter aftale/);
});

test('homepage displays the approved opening hours', async () => {
  const homepage = await readPage('.');

  assert.match(homepage, /Man-Fre 09:00-19:00<br>Weekender efter aftale/);
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

test('sitemap publishes the reviews page exactly once', async () => {
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/https:\/\/carupgrade\.dk\/anmeldelser\//g) || []).length, 1);
});

test('Vercel serves the dedicated reviews route without a legacy redirect', async () => {
  const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  const reviewsRedirect = config.redirects.find((redirect) => redirect.source === '/anmeldelser');

  assert.equal(reviewsRedirect, undefined);
});

test('structured data no longer uses the ambiguous business identity', async () => {
  for (const file of await findHtmlFiles()) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /https:\/\/carupgrade\.dk\/#business/, file);
  }
});

test('existing public pages do not expose the hidden Jylland landing pages', async () => {
  const publicPages = (await findHtmlFiles()).filter((file) =>
    !localPages.some((directory) => file.endsWith(`${directory}/index.html`))
  );

  for (const file of publicPages) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /href="\/mobil-mekaniker-jylland\/"/, file);
    assert.doesNotMatch(html, /href="\/mobil-mekaniker-vamdrup\/"/, file);
  }
});

test('every hidden Jylland landing page links back to CarUpgrade', async () => {
  for (const directory of localPages) {
    const html = await readPage(directory);
    assert.match(html, /href="\/"/, directory);
  }
});

test('general pages describe coverage on Sjælland and in Jylland', async () => {
  const footerPages = [
    '.',
    'FAQ',
    'cookiepolitik',
    'handels-og-garantibestemmelser',
    'privatlivspolitik'
  ];
  const approvedFooter = /Professionelt mobilt værksted der kommer til dig på Sjælland og i Jylland\. Uddannede mekanikere, gennemsigtige priser og garanti på alt arbejde\./;

  for (const directory of footerPages) {
    assert.match(await readPage(directory), approvedFooter, directory);
  }

  const generalServicePages = [
    'bilservice-hjemme',
    'biludstyr-og-infotainment',
    'bremser',
    'fejlfinding-bil',
    'mobil-mekaniker',
    'mobilt-vaerksted',
    'olieskift-hjemme',
    'serviceeftersyn-bil'
  ];

  for (const directory of generalServicePages) {
    const html = await readPage(directory);
    const service = readGraph(html).find((entity) => entity['@type'] === 'Service');
    assert.deepEqual(service.areaServed, ['Sjælland', 'Jylland'], directory);
  }

  const sjællandPage = await readPage('mobilt-vaerksted-sjaelland');
  assert.match(sjællandPage, /<h1>Mobilt værksted på Sjælland<\/h1>/);
  assert.match(sjællandPage, /"areaServed": "Sjælland"/);
});

test('consent stylesheet contains responsive and keyboard-focus states', async () => {
  const css = await readFile(path.join(root, 'assets/cookie-consent.css'), 'utf8');
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /bottom:\s*0/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media/);
});
