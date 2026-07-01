# Jylland Local SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish eight useful, indexable local landing pages for the Vamdrup branch and separate the Værløse and Vamdrup identities throughout the site's structured data.

**Architecture:** Keep the existing hand-authored static HTML architecture. Represent CarUpgrade as one `Organization` with two stable `AutoRepair` location IDs, use Vamdrup as provider on Jylland pages, and connect the new regional hub and city pages with visible internal links. Extend the Node integration tests to enforce page inventory, metadata, provider identity, linking, and sitemap coverage.

**Tech Stack:** Static HTML5, CSS, JSON-LD/Schema.org, XML sitemap, Node.js built-in test runner, existing cookie-consent JavaScript.

---

## File map

**Create**

- `mobil-mekaniker-vamdrup/index.html` — physical Vamdrup branch and primary conversion page
- `mobil-mekaniker-jylland/index.html` — regional coverage hub
- `mobil-mekaniker-kolding/index.html` — local mobile-mechanic service page
- `mobil-mekaniker-haderslev/index.html` — local mobile-mechanic service page
- `mobil-mekaniker-vejen/index.html` — local mobile-mechanic service page
- `mobil-mekaniker-fredericia/index.html` — local mobile-mechanic service page
- `mobil-mekaniker-vejle/index.html` — local mobile-mechanic service page
- `mobil-mekaniker-esbjerg/index.html` — local mobile-mechanic service page

**Modify**

- `tests/html-integration.test.mjs` — regression coverage for local pages, schema identities, links, and sitemap
- `index.html` — organization/location graph and visible Jylland entry point
- `mobil-mekaniker/index.html` — visible contextual links to the two regional hubs
- `mobilt-vaerksted/index.html` — visible contextual links to the two regional hubs
- `bilservice-hjemme/index.html` — contextual Vamdrup/Jylland link
- `serviceeftersyn-bil/index.html` — contextual Vamdrup/Jylland link
- `olieskift-hjemme/index.html` — contextual Vamdrup/Jylland link
- `bremser/index.html` — contextual Vamdrup/Jylland link
- `fejlfinding-bil/index.html` — contextual Vamdrup/Jylland link
- `mobil-mekaniker-vaerloese/index.html` — Værløse location ID
- `autovaerksted-vaerloese/index.html` — Værløse location ID
- `mobil-mekaniker-koebenhavn/index.html` — Værløse provider ID
- `mobilt-vaerksted-sjaelland/index.html` — Værløse provider ID
- remaining HTML pages containing `https://carupgrade.dk/#business` — replace ambiguous entity references with organization or Værløse location as specified below
- `sitemap.xml` — add all eight canonical URLs and simplify ignored sitemap hints

Do not introduce a template engine or JavaScript rendering. Search-critical content and JSON-LD remain in the initial HTML response.

### Task 1: Add failing local SEO contract tests

**Files:**

- Modify: `tests/html-integration.test.mjs`
- Test: `tests/html-integration.test.mjs`

- [ ] **Step 1: Add JSON-LD and local-page helpers**

Add after `findHtmlFiles`:

```js
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
```

- [ ] **Step 2: Add inventory, canonical, schema, internal-link, and sitemap tests**

Append these tests:

```js
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
  assert.notEqual('https://carupgrade.dk/#location-vaerloese', 'https://carupgrade.dk/#location-vamdrup');
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
```

- [ ] **Step 3: Update the existing page-count expectation**

Change `assert.equal(files.length, 18)` to:

```js
assert.equal(files.length, 26);
```

- [ ] **Step 4: Run the tests and verify the new contract fails**

Run: `npm test`

Expected: failures report missing `mobil-mekaniker-vamdrup/index.html` and the page count remains 18. Existing cookie-consent tests still pass.

- [ ] **Step 5: Commit the failing tests**

```bash
git add tests/html-integration.test.mjs
git commit -m "test: define Jylland local SEO contract"
```

### Task 2: Separate organization and location identities

**Files:**

- Modify: `index.html`
- Modify: every existing `index.html` returned by `rg -l 'https://carupgrade.dk/#business|Violvej 10' --glob '**/index.html' --glob 'index.html'`
- Test: `tests/html-integration.test.mjs`

- [ ] **Step 1: Replace the homepage's ambiguous business entity**

Use these stable IDs in the homepage JSON-LD graph:

```json
{
  "@type": "Organization",
  "@id": "https://carupgrade.dk/#organization",
  "name": "CarUpgrade",
  "legalName": "Carupgrade",
  "url": "https://carupgrade.dk/",
  "logo": "https://carupgrade.dk/assets/carupgrade-logo.png",
  "telephone": "+45 31 14 77 37",
  "email": "info@carupgrade.dk",
  "vatID": "DK46080009"
},
{
  "@type": ["AutoRepair", "LocalBusiness"],
  "@id": "https://carupgrade.dk/#location-vaerloese",
  "name": "CarUpgrade Værløse",
  "url": "https://carupgrade.dk/mobil-mekaniker-vaerloese/",
  "telephone": "+45 31 14 77 37",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Violvej 10",
    "postalCode": "3500",
    "addressLocality": "Værløse",
    "addressCountry": "DK"
  },
  "parentOrganization": { "@id": "https://carupgrade.dk/#organization" }
},
{
  "@type": ["AutoRepair", "LocalBusiness"],
  "@id": "https://carupgrade.dk/#location-vamdrup",
  "name": "CarUpgrade Vamdrup",
  "url": "https://carupgrade.dk/mobil-mekaniker-vamdrup/",
  "telephone": "+45 31 14 77 37",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Gåskærvej 12",
    "postalCode": "6580",
    "addressLocality": "Vamdrup",
    "addressCountry": "DK"
  },
  "openingHours": ["Mo-Sa 09:00-19:00"],
  "parentOrganization": { "@id": "https://carupgrade.dk/#organization" }
}
```

Keep the existing image, `priceRange`, and service-area properties where they remain factually correct. Change `WebSite.publisher` and general-site `WebPage.about` references to `https://carupgrade.dk/#organization`.

- [ ] **Step 2: Assign the Værløse provider only to Sjælland-specific pages**

On these four pages, replace the old `#business` provider/about reference with `https://carupgrade.dk/#location-vaerloese` and rename the embedded entity ID accordingly:

```text
mobil-mekaniker-vaerloese/index.html
autovaerksted-vaerloese/index.html
mobil-mekaniker-koebenhavn/index.html
mobilt-vaerksted-sjaelland/index.html
```

Use `https://carupgrade.dk/#organization` as `WebSite.publisher`. Preserve the Værløse address and do not add the Vamdrup address to these pages.

- [ ] **Step 3: Make general and legal pages organization-scoped**

For every other existing page containing the old ID, change the first entity to `Organization`, set its ID to `https://carupgrade.dk/#organization`, remove the location-only `address` and `areaServed` fields, and update publisher/about/provider references to the organization. General service pages may use the organization as `Service.provider`; they must not imply that all work is delivered from Værløse.

- [ ] **Step 4: Add a test that rejects the retired ID**

Append:

```js
test('structured data no longer uses the ambiguous business identity', async () => {
  for (const file of await findHtmlFiles()) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /https:\/\/carupgrade\.dk\/#business/, file);
  }
});
```

- [ ] **Step 5: Run tests and verify the identity tests pass while page creation tests still fail**

Run: `npm test`

Expected: the retired-ID and homepage location-identity tests pass. Failures remain only for the eight absent pages, page count, links, and sitemap.

- [ ] **Step 6: Commit the identity split**

```bash
git add index.html FAQ/index.html autovaerksted-vaerloese/index.html bilservice-hjemme/index.html biludstyr-og-infotainment/index.html bremser/index.html cookiepolitik/index.html fejlfinding-bil/index.html handels-og-garantibestemmelser/index.html mobil-mekaniker-koebenhavn/index.html mobil-mekaniker-vaerloese/index.html mobil-mekaniker/index.html mobilt-vaerksted-sjaelland/index.html mobilt-vaerksted/index.html olieskift-hjemme/index.html om-os/index.html privatlivspolitik/index.html serviceeftersyn-bil/index.html tests/html-integration.test.mjs
git commit -m "refactor: separate CarUpgrade location identities"
```

### Task 3: Create the Vamdrup branch page

**Files:**

- Create: `mobil-mekaniker-vamdrup/index.html`
- Test: `tests/html-integration.test.mjs`

- [ ] **Step 1: Start from the established local-page structure**

Create the directory and use `mobil-mekaniker-vaerloese/index.html` as the structural baseline. Preserve its responsive layout, semantic sections, consent assets, keyboard-visible links, image dimensions, and footer. Do not preserve Værløse copy or its location ID.

- [ ] **Step 2: Add exact Vamdrup metadata**

```html
<meta name="description" content="Mobil mekaniker i Vamdrup til service, fejlfinding og reparation hos dig. Besøg også CarUpgrades værksted på Gåskærvej 12.">
<meta name="robots" content="index, follow, max-image-preview:large">
<title>Mobil mekaniker i Vamdrup og lokalt værksted | CarUpgrade</title>
<link rel="canonical" href="https://carupgrade.dk/mobil-mekaniker-vamdrup/">
```

Mirror the title, description, canonical URL, image, and image alt text in Open Graph and Twitter metadata.

- [ ] **Step 3: Add the branch and service JSON-LD**

The graph must contain `Organization`, the approved `#location-vamdrup` entity from Task 2, `WebSite`, `WebPage`, `Service`, `FAQPage`, and `BreadcrumbList`. Use:

```json
{
  "@type": "Service",
  "@id": "https://carupgrade.dk/mobil-mekaniker-vamdrup/#service",
  "name": "Mobil mekaniker i Vamdrup",
  "serviceType": "Mobil bilservice og reparation",
  "provider": { "@id": "https://carupgrade.dk/#location-vamdrup" },
  "areaServed": { "@type": "City", "name": "Vamdrup" },
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock",
    "url": "https://carupgrade.dk/mobil-mekaniker-vamdrup/"
  }
}
```

Before adding `geo`, verify the pin in the completed Google Business Profile against Gåskærvej 12. If the profile is not yet live, omit `geo`; an omitted optional field is preferable to guessed coordinates.

- [ ] **Step 4: Write the visible Vamdrup content**

Use these section responsibilities and claims:

```text
H1: Mobil mekaniker i Vamdrup
Lead: CarUpgrade kører ud fra Gåskærvej 12 og udfører service, fejlfinding og reparation dér, hvor bilen holder. Komplekse opgaver kan tages ind på værkstedet.
Section: Mobil service hjemme eller på arbejde
Section: Hvornår bilen kommer på værksted
Section: Værksted på Gåskærvej 12
Facts: Mandag-lørdag 09-19; søndag lukket; +45 31 14 77 37
Process: Beskriv opgaven -> aftal sted og tid -> mobil reparation eller værkstedsforløb
FAQ: Kan jeg møde op på værkstedet? / Hvilke opgaver klares hos mig? / Hvad sker der, hvis opgaven kræver lift?
```

All prose must distinguish between work at the customer's location and work at the physical workshop. Include a telephone link and a contact CTA to `/#kontakt`.

Add a visible “Få rutevejledning” link without embedding a third-party map before consent:

```html
<a href="https://www.google.com/maps/search/?api=1&amp;query=G%C3%A5sk%C3%A6rvej+12%2C+6580+Vamdrup" rel="noopener">Få rutevejledning til værkstedet</a>
```

- [ ] **Step 5: Run the focused Vamdrup tests**

Run: `node --test --test-name-pattern='Vamdrup branch|Jylland local pages' tests/html-integration.test.mjs`

Expected: branch facts pass. The local-page test still fails when it reaches the absent Jylland/city pages.

- [ ] **Step 6: Commit the branch page**

```bash
git add mobil-mekaniker-vamdrup/index.html
git commit -m "feat: add Vamdrup branch landing page"
```

### Task 4: Create the Jylland coverage hub

**Files:**

- Create: `mobil-mekaniker-jylland/index.html`
- Test: `tests/html-integration.test.mjs`

- [ ] **Step 1: Create the regional page with exact metadata**

Use the same static layout contract as the Vamdrup page and add:

```html
<meta name="description" content="Mobil mekaniker i Jylland med base i Vamdrup. Få bilservice, fejlfinding og reparation hjemme, på arbejdet eller efter aftale.">
<title>Mobil mekaniker i Jylland | Mobilt værksted fra Vamdrup</title>
<link rel="canonical" href="https://carupgrade.dk/mobil-mekaniker-jylland/">
```

- [ ] **Step 2: Add regional service schema**

Use `https://carupgrade.dk/#location-vamdrup` as provider, `Jylland` as `areaServed`, and the page's own canonical URL in `WebPage`, `Service`, and breadcrumbs. Do not give the page a second physical address.

- [ ] **Step 3: Add regional content and a visible coverage grid**

The page must explain that jobs are accepted according to distance, task, access conditions, and available time. Include visible links with these exact targets:

```html
<a href="/mobil-mekaniker-vamdrup/">Vamdrup</a>
<a href="/mobil-mekaniker-kolding/">Kolding</a>
<a href="/mobil-mekaniker-haderslev/">Haderslev</a>
<a href="/mobil-mekaniker-vejen/">Vejen</a>
<a href="/mobil-mekaniker-fredericia/">Fredericia</a>
<a href="/mobil-mekaniker-vejle/">Vejle</a>
<a href="/mobil-mekaniker-esbjerg/">Esbjerg</a>
```

Use these sections: “Udekørende mekaniker fra Vamdrup”, “Områder vi dækker”, “Opgaver hos dig”, “Komplekse opgaver på værkstedet” and three regional FAQs. State “cirka 100 km” as an indicative service radius, not an unconditional guarantee.

- [ ] **Step 4: Run the focused hub test**

Run: `node --test --test-name-pattern='Jylland hub' tests/html-integration.test.mjs`

Expected: PASS because link presence is tested even before the target pages exist.

- [ ] **Step 5: Commit the hub**

```bash
git add mobil-mekaniker-jylland/index.html
git commit -m "feat: add Jylland mobile mechanic hub"
```

### Task 5: Create six distinct city service pages

**Files:**

- Create: `mobil-mekaniker-kolding/index.html`
- Create: `mobil-mekaniker-haderslev/index.html`
- Create: `mobil-mekaniker-vejen/index.html`
- Create: `mobil-mekaniker-fredericia/index.html`
- Create: `mobil-mekaniker-vejle/index.html`
- Create: `mobil-mekaniker-esbjerg/index.html`
- Test: `tests/html-integration.test.mjs`

- [ ] **Step 1: Use this exact metadata matrix**

| Directory | Title | Description |
|---|---|---|
| `mobil-mekaniker-kolding` | `Mobil mekaniker i Kolding | Bilservice hos dig | CarUpgrade` | `Mobil mekaniker i Kolding til service, fejlfinding og reparation hos dig. CarUpgrade kører ud fra værkstedet ved Vamdrup.` |
| `mobil-mekaniker-haderslev` | `Mobil mekaniker i Haderslev | CarUpgrade kommer til bilen` | `Få mobil bilservice og reparation i Haderslev. CarUpgrade kommer til bilen og tager komplekse opgaver på værkstedet i Vamdrup.` |
| `mobil-mekaniker-vejen` | `Mobil mekaniker i Vejen | Service og reparation hos dig` | `Mobil mekaniker i Vejen til bilservice, fejlfinding og mindre reparationer. Vi kører ud fra CarUpgrades afdeling i Vamdrup.` |
| `mobil-mekaniker-fredericia` | `Mobil mekaniker i Fredericia | Bilservice hvor bilen holder` | `Book mobil mekaniker i Fredericia til service, fejlfinding og reparation. CarUpgrade vurderer opgaven og kommer til bilen efter aftale.` |
| `mobil-mekaniker-vejle` | `Mobil mekaniker i Vejle | Mobil bilservice fra CarUpgrade` | `Mobil mekaniker i Vejle til service, fejlfinding og udvalgte reparationer hos dig. Komplekse opgaver klares på værkstedet.` |
| `mobil-mekaniker-esbjerg` | `Mobil mekaniker i Esbjerg | Service og fejlfinding hos dig` | `Få mobil mekaniker i Esbjerg efter aftale. CarUpgrade udfører service og fejlfinding hos bilen og vurderer større værkstedsopgaver.` |

Each canonical is `https://carupgrade.dk/{directory}/`. Mirror each page's unique values into Open Graph, Twitter, WebPage, and Service data.

- [ ] **Step 2: Give every page the same factual service boundary but unique local framing**

Every page must say that CarUpgrade starts from Vamdrup, confirms the assignment before driving, performs suitable jobs at the parked car, and may bring complex jobs to Gåskærvej 12. Use `https://carupgrade.dk/#location-vamdrup` as `Service.provider`. Never add a Kolding, Haderslev, Vejen, Fredericia, Vejle, or Esbjerg street address.

- [ ] **Step 3: Write distinct section and FAQ sets**

Use the following page-specific content map:

| City | Local framing | Named surrounding areas | Unique FAQ emphasis |
|---|---|---|---|
| Kolding | nearest large commercial center; home and workplace appointments | Vonsild, Seest, Bramdrupdam | parking/access, workplace visits, workshop transfer |
| Haderslev | southbound coverage from Vamdrup; planned appointments | Vojens, Christiansfeld | booking lead time, diagnostics, lift-required work |
| Vejen | short westbound coverage; home service | Lunderskov, Brørup, Holsted | address assessment, routine service, parts readiness |
| Fredericia | Triangle Region appointments; safe work area required | Taulov, Erritsø, Børkop | workplace service, travel confirmation, workshop transport |
| Vejle | eastern coverage booked according to task and route | Egtved, Bredballe, Jelling | coverage confirmation, fault finding, complex repairs |
| Esbjerg | outer part of the initial radius; assignments grouped and confirmed | Bramming, Ribe, Varde | travel planning, suitable job scope, rescheduling |

Do not claim fixed arrival times. If distance is stated, describe it as approximate and verify the route from Gåskærvej 12 with the same map source across all pages before publication.

- [ ] **Step 4: Add bidirectional links**

Each city page must link to `/mobil-mekaniker-jylland/`, `/mobil-mekaniker-vamdrup/`, `/#kontakt`, and at least two relevant service pages among `/bilservice-hjemme/`, `/serviceeftersyn-bil/`, `/olieskift-hjemme/`, `/bremser/`, and `/fejlfinding-bil/`.

- [ ] **Step 5: Run local-page tests**

Run: `node --test --test-name-pattern='Jylland local pages|Jylland hub|Vamdrup branch' tests/html-integration.test.mjs`

Expected: all three selected tests pass. The full suite still fails on the page-count expectation until all files are counted and on sitemap coverage until Task 7.

- [ ] **Step 6: Commit the city pages**

```bash
git add mobil-mekaniker-kolding/index.html mobil-mekaniker-haderslev/index.html mobil-mekaniker-vejen/index.html mobil-mekaniker-fredericia/index.html mobil-mekaniker-vejle/index.html mobil-mekaniker-esbjerg/index.html
git commit -m "feat: add initial Jylland city landing pages"
```

### Task 6: Connect the new pages to the existing site

**Files:**

- Modify: `index.html`
- Modify: `mobil-mekaniker/index.html`
- Modify: `mobilt-vaerksted/index.html`
- Modify: `bilservice-hjemme/index.html`
- Modify: `serviceeftersyn-bil/index.html`
- Modify: `olieskift-hjemme/index.html`
- Modify: `bremser/index.html`
- Modify: `fejlfinding-bil/index.html`
- Test: `tests/html-integration.test.mjs`

- [ ] **Step 1: Add a failing entry-point test**

```js
test('main service pages provide visible entry points to Jylland coverage', async () => {
  for (const directory of ['.', 'mobil-mekaniker', 'mobilt-vaerksted']) {
    const html = await readPage(directory);
    assert.match(html, /href="\/mobil-mekaniker-jylland\/"/, directory);
    assert.match(html, /href="\/mobil-mekaniker-vamdrup\/"/, directory);
  }
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test --test-name-pattern='entry points' tests/html-integration.test.mjs`

Expected: FAIL on the homepage because the links are absent.

- [ ] **Step 3: Add visible “Områder vi dækker” content**

On the homepage, `/mobil-mekaniker/`, and `/mobilt-vaerksted/`, add a visible region block with:

```html
<a href="/mobil-mekaniker-jylland/">Mobil mekaniker i Jylland</a>
<a href="/mobil-mekaniker-vamdrup/">Afdeling og værksted i Vamdrup</a>
<a href="/mobilt-vaerksted-sjaelland/">Mobilt værksted på Sjælland</a>
```

Place it in the main content near the service/coverage explanation, not in hidden markup. Match each page's existing CSS and responsive layout.

- [ ] **Step 4: Add contextual links from individual service pages**

Add one short visible paragraph to each listed service page explaining that the service is available from Vamdrup into Jylland, linking “Vamdrup” to `/mobil-mekaniker-vamdrup/` and “Jylland” to `/mobil-mekaniker-jylland/`. Keep the original service intent primary.

- [ ] **Step 5: Run the entry-point and full HTML tests**

Run: `npm test`

Expected: entry-point, cookie, schema, page-count, and local-page tests pass; sitemap coverage remains the only expected failure.

- [ ] **Step 6: Commit internal linking**

```bash
git add index.html mobil-mekaniker/index.html mobilt-vaerksted/index.html bilservice-hjemme/index.html serviceeftersyn-bil/index.html olieskift-hjemme/index.html bremser/index.html fejlfinding-bil/index.html tests/html-integration.test.mjs
git commit -m "feat: link Jylland coverage across service pages"
```

### Task 7: Publish the sitemap and complete technical verification

**Files:**

- Modify: `sitemap.xml`
- Verify: `robots.txt`
- Test: `tests/html-integration.test.mjs`

- [ ] **Step 1: Add the eight canonical sitemap entries**

Use this shape for each new URL and the actual publication date:

```xml
<url>
  <loc>https://carupgrade.dk/mobil-mekaniker-vamdrup/</loc>
  <lastmod>2026-07-01</lastmod>
</url>
```

Add the other seven URLs from `localPages`. Remove all `<changefreq>` and `<priority>` elements from the sitemap because they are not used by Google. Preserve every existing canonical URL.

- [ ] **Step 2: Verify robots and sitemap mechanically**

Run:

```bash
rg -n 'Disallow|Sitemap' robots.txt
rg -c '<loc>' sitemap.xml
```

Expected: no `Disallow` rule, one sitemap declaration, and 26 `<loc>` entries.

- [ ] **Step 3: Run all automated tests**

Run: `npm test`

Expected: 0 failures.

- [ ] **Step 4: Check markup and retired IDs**

Run:

```bash
git diff --check
rg 'https://carupgrade.dk/#business' --glob '**/index.html' --glob 'index.html'
rg -L 'data-cookie-settings' --glob '**/index.html' --glob 'index.html'
```

Expected: all commands produce no error output; the two `rg` content checks return no file matches.

- [ ] **Step 5: Serve the static site and inspect representative pages**

Run: `python3 -m http.server 8000`

Inspect these pages at desktop and mobile widths:

```text
http://localhost:8000/
http://localhost:8000/mobil-mekaniker-vamdrup/
http://localhost:8000/mobil-mekaniker-jylland/
http://localhost:8000/mobil-mekaniker-kolding/
http://localhost:8000/mobil-mekaniker-esbjerg/
```

Expected: no horizontal overflow, all images load, coverage links are visible, breadcrumbs work, phone links use `tel:+4531147737`, contact links reach `/#kontakt`, and the cookie banner/settings control remains usable with keyboard navigation.

- [ ] **Step 6: Validate structured data externally**

After deployment, submit the Vamdrup, Jylland, Kolding, and Esbjerg URLs to Google's Rich Results Test. Confirm valid JSON-LD with no critical errors. Then inspect each live canonical and sitemap URL in Search Console and request indexing for Vamdrup and Jylland first.

- [ ] **Step 7: Configure the Vamdrup Google Business Profile link**

Set the profile website URL to:

```text
https://carupgrade.dk/mobil-mekaniker-vamdrup/?utm_source=google&utm_medium=organic&utm_campaign=gbp_vamdrup
```

Confirm that profile name, Gåskærvej 12, phone `31 14 77 37`, Monday-Saturday 09-19 hours, and visible website facts match exactly.

- [ ] **Step 8: Commit sitemap publication**

```bash
git add sitemap.xml
git commit -m "feat: publish Jylland local pages in sitemap"
```

### Task 8: Track phone clicks and successful leads

**Files:**

- Modify: `assets/cookie-consent.js`
- Modify: `index.html`
- Modify: `tests/cookie-consent.test.mjs`

- [ ] **Step 1: Extend the consent test page with a telephone link**

Change the JSDOM body in `createPage` to:

```html
<body>
  <a href="tel:+4531147737">Ring</a>
  <footer><a href="#" data-cookie-settings>Cookieindstillinger</a></footer>
</body>
```

- [ ] **Step 2: Add failing measurement-consent tests**

Append:

```js
test('accepted consent tracks telephone clicks', async () => {
  const dom = await createPage('accepted');
  dom.window.document.querySelector('a[href^="tel:"]').click();

  assert.ok(dom.window.dataLayer.some((entry) => entry[0] === 'event' && entry[1] === 'phone_click'));
});

test('rejected consent does not track telephone clicks', async () => {
  const dom = await createPage('rejected');
  dom.window.document.querySelector('a[href^="tel:"]').click();

  assert.equal(dom.window.dataLayer, undefined);
});

test('accepted consent tracks successful contact events', async () => {
  const dom = await createPage('accepted');
  dom.window.document.dispatchEvent(new dom.window.CustomEvent('carupgrade:contact-success'));

  assert.ok(dom.window.dataLayer.some((entry) => entry[0] === 'event' && entry[1] === 'generate_lead'));
});
```

- [ ] **Step 3: Run the tests and verify they fail**

Run: `node --test tests/cookie-consent.test.mjs`

Expected: the three new tests fail because no measurement listeners exist.

- [ ] **Step 4: Add consent-gated event tracking**

Add to `assets/cookie-consent.js` and call `bindMeasurementEvents()` from `init()`:

```js
function trackEvent(name, parameters = {}) {
  if (readConsent() !== 'accepted') return;
  loadAnalytics();
  window.gtag('event', name, parameters);
}

function bindMeasurementEvents() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="tel:"]');
    if (!link) return;
    trackEvent('phone_click', {
      link_url: link.getAttribute('href'),
      page_location: window.location.href
    });
  });

  document.addEventListener('carupgrade:contact-success', () => {
    trackEvent('generate_lead', {
      form_id: 'contactForm',
      page_location: window.location.href
    });
  });
}
```

This records no event and loads no Google script when consent is absent or rejected.

- [ ] **Step 5: Emit the success event only after the API confirms the lead**

In the homepage contact handler, immediately after the successful `contactForm.reset()` call, add:

```js
document.dispatchEvent(new CustomEvent('carupgrade:contact-success'));
```

Do not emit it for validation errors, Turnstile failures, HTTP errors, or honeypot-only responses handled outside the visible form flow.

- [ ] **Step 6: Run consent and full tests**

Run: `npm test`

Expected: 0 failures.

- [ ] **Step 7: Commit measurement support**

```bash
git add assets/cookie-consent.js index.html tests/cookie-consent.test.mjs
git commit -m "feat: track local SEO conversions with consent"
```

### Task 9: Record the measurement baseline

**Files:**

- Create: `docs/seo/jylland-baseline.md`

- [ ] **Step 1: Create the baseline record after deployment**

Use this exact document structure and replace each numeric zero only when live data exists:

```markdown
# Jylland SEO baseline

**Launch date:** 2026-07-01
**Review window:** 8-12 weeks after launch

| Landing page | Search impressions | Organic clicks | Phone clicks | Contact submissions |
|---|---:|---:|---:|---:|
| Vamdrup | 0 | 0 | 0 | 0 |
| Jylland | 0 | 0 | 0 | 0 |
| Kolding | 0 | 0 | 0 | 0 |
| Haderslev | 0 | 0 | 0 | 0 |
| Vejen | 0 | 0 | 0 | 0 |
| Fredericia | 0 | 0 | 0 | 0 |
| Vejle | 0 | 0 | 0 | 0 |
| Esbjerg | 0 | 0 | 0 | 0 |

## Expansion rule

Add another city only when Search Console, Google Business Profile, or qualified leads show demand and a genuinely distinct local page can be written.
```

- [ ] **Step 2: Confirm analytics event availability**

In GA4 DebugView with consent accepted, click a `tel:` link and submit the contact form in a non-production test flow. Record `phone_click` and `generate_lead` under a new `## Tracked conversions` heading. If either event is absent, fix Task 8 before recording the launch baseline.

- [ ] **Step 3: Commit the baseline**

```bash
git add docs/seo/jylland-baseline.md
git commit -m "docs: record Jylland SEO launch baseline"
```
