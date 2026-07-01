# Sitewide Jylland Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every general CarUpgrade coverage statement consistently describe service on Sjælland and in Jylland while preserving location-specific landing-page copy.

**Architecture:** Keep the static HTML structure unchanged. Add an integration-test contract that identifies the general pages, enforces the approved footer sentence, verifies both regions in general service schema, and protects the dedicated Sjælland page from broad replacement; then update only the classified general copy, metadata, and JSON-LD.

**Tech Stack:** Static HTML, JSON-LD, Node.js built-in test runner

---

### Task 1: Define the geographic-copy contract

**Files:**
- Modify: `tests/html-integration.test.mjs`

- [ ] **Step 1: Add a failing integration test**

Append this test:

```js
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
```

- [ ] **Step 2: Run the new test and verify failure**

Run: `node --test --test-name-pattern='general pages describe coverage' tests/html-integration.test.mjs`

Expected: FAIL because the existing footer omits Jylland and general service schemas still use a single `"Sjælland"` value.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/html-integration.test.mjs
git commit -m "test: define sitewide geographic copy contract"
```

### Task 2: Update shared general copy

**Files:**
- Modify: `index.html`
- Modify: `FAQ/index.html`
- Modify: `cookiepolitik/index.html`
- Modify: `handels-og-garantibestemmelser/index.html`
- Modify: `privatlivspolitik/index.html`

- [ ] **Step 1: Replace the old footer sentence on all five pages**

Use this exact sentence without altering the surrounding footer markup:

```html
<p>Professionelt mobilt værksted der kommer til dig på Sjælland og i Jylland. Uddannede mekanikere, gennemsigtige priser og garanti på alt arbejde.</p>
```

- [ ] **Step 2: Correct general homepage geography**

In `index.html`, use “på Sjælland og i Jylland” in the meta description, matching JSON-LD description, hero badge, contact coverage value, and the flexible-help statement. Keep branch labels and organization location names unchanged.

- [ ] **Step 3: Update FAQ-wide coverage statements**

In `FAQ/index.html`, change the page meta description, JSON-LD page description, the “kommer I hjem til mig?” answer in JSON-LD, and its visible duplicate so each describes service “på Sjælland og i Jylland”. Keep the existing broader answer about both regions intact.

- [ ] **Step 4: Verify the shared-copy portion**

Run: `node --test --test-name-pattern='general pages describe coverage' tests/html-integration.test.mjs`

Expected: FAIL only on the general service-page `areaServed` assertions.

- [ ] **Step 5: Commit shared copy**

```bash
git add index.html FAQ/index.html cookiepolitik/index.html handels-og-garantibestemmelser/index.html privatlivspolitik/index.html
git commit -m "fix: mention Jylland in general site copy"
```

### Task 3: Update general service pages and schema

**Files:**
- Modify: `bilservice-hjemme/index.html`
- Modify: `biludstyr-og-infotainment/index.html`
- Modify: `bremser/index.html`
- Modify: `fejlfinding-bil/index.html`
- Modify: `mobil-mekaniker/index.html`
- Modify: `mobilt-vaerksted/index.html`
- Modify: `olieskift-hjemme/index.html`
- Modify: `serviceeftersyn-bil/index.html`

- [ ] **Step 1: Expand general service schema coverage**

On each listed page, replace the general service entity’s scalar coverage with:

```json
"areaServed": [
  "Sjælland",
  "Jylland"
]
```

- [ ] **Step 2: Align generic metadata descriptions**

Where a listed page’s meta description, Open Graph description, Twitter description, WebPage description, or Service description currently ends by limiting the general service to Sjælland, change that phrase to “på Sjælland og i Jylland”. Preserve service-specific wording and do not change titles solely targeting a dedicated local landing page.

- [ ] **Step 3: Align the generic mobile-workshop page**

In `mobilt-vaerksted/index.html`, update the title variants, metadata, JSON-LD name and descriptions, lead, and FAQ coverage answer to both regions. Use “Mobilt værksted på Sjælland og i Jylland” and “CarUpgrade dækker Sjælland og Jylland efter aftale” consistently.

- [ ] **Step 4: Confirm location-specific pages were preserved**

Run:

```bash
rg -n 'Mobilt værksted på Sjælland|"areaServed": "Sjælland"' mobilt-vaerksted-sjaelland/index.html mobil-mekaniker-vaerloese/index.html
```

Expected: The dedicated Sjælland and Værløse pages still contain their local Sjælland wording and scalar coverage.

- [ ] **Step 5: Run the focused test**

Run: `node --test --test-name-pattern='general pages describe coverage' tests/html-integration.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit service-page alignment**

```bash
git add bilservice-hjemme/index.html biludstyr-og-infotainment/index.html bremser/index.html fejlfinding-bil/index.html mobil-mekaniker/index.html mobilt-vaerksted/index.html olieskift-hjemme/index.html serviceeftersyn-bil/index.html
git commit -m "fix: align general service coverage with Jylland"
```

### Task 4: Verify the complete site

**Files:**
- Verify: all modified HTML and test files

- [ ] **Step 1: Check for stale approved-footer text**

Run: `rg -n --glob 'index.html' 'Professionelt mobilt værksted der kommer til dig på Sjælland\.' .`

Expected: no output.

- [ ] **Step 2: Run all tests**

Run: `npm test`

Expected: all tests pass with exit code 0.

- [ ] **Step 3: Check formatting and scope**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; status lists only the intended implementation files if any remain uncommitted.

- [ ] **Step 4: Commit any verification-only corrections**

If verification required corrections:

```bash
git add tests/html-integration.test.mjs index.html FAQ/index.html cookiepolitik/index.html handels-og-garantibestemmelser/index.html privatlivspolitik/index.html bilservice-hjemme/index.html biludstyr-og-infotainment/index.html bremser/index.html fejlfinding-bil/index.html mobil-mekaniker/index.html mobilt-vaerksted/index.html olieskift-hjemme/index.html serviceeftersyn-bil/index.html
git commit -m "fix: complete Jylland copy consistency"
```

If no corrections were required, do not create an empty commit.
