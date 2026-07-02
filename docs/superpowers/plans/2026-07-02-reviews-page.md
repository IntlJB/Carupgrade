# Reviews Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move CarUpgrade's reviews to a dedicated `/anmeldelser/` page, update sitewide Trustpilot facts, and add the existing contact conversion flow to the bottom of the new page.

**Architecture:** Keep the repository's static multi-page structure: one self-contained `index.html` per route, shared serverless `/api/contact`, and HTML integration tests in Node. The new page reuses the homepage's visual patterns and form behavior without adding a runtime Trustpilot dependency or changing the contact API.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Node.js test runner, jsdom, Vercel serverless functions, Cloudflare Turnstile, Resend.

---

## File map

- Create `anmeldelser/index.html`: dedicated reviews page, review cards, Trustpilot summary, CTA, contact form, page scripts, metadata, and footer.
- Modify `index.html`: remove the reviews section, update Trustpilot facts, and point review navigation to the new route.
- Modify every existing public `index.html`: replace internal `/#anmeldelser` review links with `/anmeldelser/` and keep review navigation between Reparationer and Om Os where the full navigation is present.
- Modify `sitemap.xml`: publish the new canonical URL.
- Modify `tests/html-integration.test.mjs`: cover page count, review content, navigation order, homepage removal, sitewide links, sitemap, metadata, and form integration.

### Task 1: Lock down global navigation and homepage behavior

**Files:**
- Modify: `tests/html-integration.test.mjs`
- Modify: `index.html`
- Modify: every existing route's `index.html` containing `/#anmeldelser` or `#anmeldelser`

- [ ] **Step 1: Write failing integration tests**

Add these tests after the existing navigation tests:

```js
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
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
node --test --test-name-pattern='review navigation|full navigation places Anmeldelser|homepage no longer' tests/html-integration.test.mjs
```

Expected: FAIL because links still target the homepage anchor, the old review section is present, and the old score is `3.8`.

- [ ] **Step 3: Update the homepage navigation, score, and review section**

In `index.html`, make the relevant navigation sequence exactly:

```html
<li><a href="#reparationer">Reparationer</a></li>
<li><a href="/anmeldelser/">Anmeldelser</a></li>
<li><a href="/om-os/">Om Os</a></li>
```

Use these current score fragments:

```html
<strong>4.0★</strong>
```

```html
<div class="why-big-stat">4.0<span>★</span></div>
```

Delete the complete block from `<!-- REVIEWS -->` through its closing `</section>`, leaving `<!-- REPAIRS -->` as the next section. Delete the now-unused `.reviews`, `.reviews-header`, `.trustpilot-badge`, `.tp-*`, `.reviews-grid`, `.review-*`, and `.reviews-cta` rules plus their reviews-specific mobile overrides.

Update the homepage footer item to:

```html
<li><a href="/anmeldelser/">Anmeldelser</a></li>
```

- [ ] **Step 4: Update review links and ordering across existing pages**

For each existing route with an internal reviews link, replace it with:

```html
<a href="/anmeldelser/">Anmeldelser</a>
```

In each full main navigation, move that list item immediately after `Reparationer` and immediately before `Om Os`. Keep explicit external `https://dk.trustpilot.com/review/carupgrade.dk` links unchanged.

- [ ] **Step 5: Run the focused tests and verify pass**

Run:

```bash
node --test --test-name-pattern='review navigation|full navigation places Anmeldelser|homepage no longer' tests/html-integration.test.mjs
```

Expected: PASS for all three tests.

- [ ] **Step 6: Commit the global changes**

```bash
git add index.html '*/index.html' tests/html-integration.test.mjs
git commit -m "Move review links to dedicated route"
```

### Task 2: Create the dedicated reviews page

**Files:**
- Create: `anmeldelser/index.html`
- Modify: `tests/html-integration.test.mjs`

- [ ] **Step 1: Write failing page-content tests**

Add:

```js
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
```

- [ ] **Step 2: Run the tests and verify the missing-page failure**

Run:

```bash
node --test --test-name-pattern='reviews page publishes|reviews page renders' tests/html-integration.test.mjs
```

Expected: FAIL with `ENOENT` for `anmeldelser/index.html`.

- [ ] **Step 3: Create the page shell and metadata**

Create `anmeldelser/index.html` with the same document shell, cookie assets, fonts, favicon, fixed navigation, CSS variables, responsive breakpoints, footer, mobile-menu script, and reveal script as the homepage. Use:

```html
<meta name="description" content="Læs CarUpgrades kundeanmeldelser og se vores aktuelle Trustpilot-vurdering. Få derefter et uforpligtende tilbud på mobil bilservice.">
<title>Anmeldelser | CarUpgrade</title>
<link rel="canonical" href="https://carupgrade.dk/anmeldelser/">
```

The WebPage JSON-LD must include:

```json
{
  "@type": "WebPage",
  "@id": "https://carupgrade.dk/anmeldelser/#webpage",
  "url": "https://carupgrade.dk/anmeldelser/",
  "name": "Anmeldelser | CarUpgrade",
  "inLanguage": "da-DK",
  "isPartOf": { "@id": "https://carupgrade.dk/#website" },
  "about": { "@id": "https://carupgrade.dk/#organization" }
}
```

Do not add `AggregateRating` or `Review` JSON-LD.

- [ ] **Step 4: Add hero, summary, four cards, and external CTA**

Use this semantic content inside the page's main content:

```html
<main>
  <section class="reviews-hero">
    <div class="section-label">Kundernes oplevelser</div>
    <h1>Service, der kan mærkes</h1>
    <p>Læs, hvad kunderne siger om CarUpgrade og vores mobile værkstedsservice.</p>
    <div class="trust-summary" aria-label="Trustpilot: 4,0 ud af 5 baseret på 4 anmeldelser">
      <strong>4,0</strong>
      <span class="review-stars" aria-hidden="true">★★★★★</span>
      <span>4 anmeldelser på Trustpilot</span>
    </div>
  </section>
  <section class="reviews" aria-labelledby="reviews-title">
    <h2 id="reviews-title">Hvad vores kunder siger</h2>
    <div class="reviews-grid">
      <article class="review-card">
        <div class="review-stars" aria-label="5 ud af 5 stjerner">★★★★★</div>
        <h3>Super tilfreds!</h3>
        <p>“Hurtig, professionel og en meget behagelig service. Jeg bruger Carupgrade næste gang også. Fem stjerner herfra!”</p>
        <footer><strong>Intl</strong><span>Trustpilot · 30. juni 2026</span></footer>
      </article>
      <article class="review-card">
        <div class="review-stars" aria-label="5 ud af 5 stjerner">★★★★★</div>
        <h3>Har brugt ham flere gange og er altid...</h3>
        <p>“Har brugt ham flere gange og er altid tilfreds 👍 Hurtig og professionel service.”</p>
        <footer><strong>Sofie Jensen</strong><span>Trustpilot · 6. maj 2026</span></footer>
      </article>
      <article class="review-card">
        <div class="review-stars" aria-label="5 ud af 5 stjerner">★★★★★</div>
        <h3>Vild god service</h3>
        <p>“Vild god service. Har brugt ham flere gange, har lige fået skiftet bremser til en god pris. Altid godt humør.”</p>
        <footer><strong>Leif vester</strong><span>Trustpilot · 23. november 2025</span></footer>
      </article>
      <article class="review-card">
        <div class="review-stars" aria-label="5 ud af 5 stjerner">★★★★★</div>
        <h3>God og hurtig reparation</h3>
        <p>“God og hurtig reparation. Jeg fik pris på service bagefter, som jeg også sagde ja til.”</p>
        <footer><strong>Søren</strong><span>Trustpilot · 14. december 2024</span></footer>
      </article>
    </div>
    <a class="trustpilot-badge" href="https://dk.trustpilot.com/review/carupgrade.dk" target="_blank" rel="noopener noreferrer">Læs alle anmeldelser på Trustpilot</a>
  </section>
</main>
```

Style the hero, summary, two-column review grid, cards, star color `#00b67a`, heading hierarchy, and responsive single-column layout using the homepage's variables and spacing. Avoid external Trustpilot scripts or widgets.

- [ ] **Step 5: Run the page-content tests**

Run:

```bash
node --test --test-name-pattern='reviews page publishes|reviews page renders' tests/html-integration.test.mjs
```

Expected: PASS for both tests.

- [ ] **Step 6: Commit the reviews content**

```bash
git add anmeldelser/index.html tests/html-integration.test.mjs
git commit -m "Add dedicated reviews page"
```

### Task 3: Add the CTA and working contact flow

**Files:**
- Modify: `anmeldelser/index.html`
- Modify: `tests/html-integration.test.mjs`

- [ ] **Step 1: Write failing contact integration tests**

Add:

```js
test('reviews page ends with a strong CTA and the protected contact form', async () => {
  const reviews = await readPage('anmeldelser');
  const ctaIndex = reviews.indexOf('class="conversion-cta"');
  const formIndex = reviews.indexOf('id="contactForm"');

  assert.ok(ctaIndex > -1);
  assert.ok(formIndex > ctaIndex);
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
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
node --test --test-name-pattern='reviews page ends with' tests/html-integration.test.mjs
```

Expected: FAIL because the CTA and form have not been added.

- [ ] **Step 3: Add the conversion CTA**

Immediately after the reviews section, add:

```html
<section class="conversion-cta" aria-labelledby="cta-title">
  <div>
    <div class="section-label">Klar til næste skridt?</div>
    <h2 id="cta-title">Få samme gode service – direkte hos dig</h2>
    <p>Beskriv opgaven, så vender vi tilbage med et uforpligtende tilbud inden for 24 timer på hverdage.</p>
  </div>
  <a href="#kontakt" class="btn-primary">Få et tilbud →</a>
</section>
```

Style it as a strong red/dark horizontal conversion band on desktop and a stacked block on mobile, using the existing `.btn-primary` treatment.

- [ ] **Step 4: Add the existing contact section and behavior**

Copy the complete `<section class="contact" id="kontakt">` markup from `index.html`, including all contact details and the form fields `name`, `phone`, `email`, `car`, `service`, `message`, `website`, `turnstileWidget`, submit button, and `.form-status`.

Copy the homepage's complete form-support CSS for `.contact`, `.contact-inner`, `.contact-detail*`, `.contact-form`, `.form-group`, `.form-row`, `.form-honeypot`, `.turnstile-wrap`, `.form-submit`, and `.form-status`.

Copy the homepage's complete Turnstile/form JavaScript beginning with the Turnstile configuration state and ending with the `contactForm` submit handler. Preserve these behaviors exactly:

```js
const response = await fetch(form.action, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.fromEntries(formData.entries()))
});
```

```js
if (window.turnstile && turnstileWidgetId !== null) {
  window.turnstile.reset(turnstileWidgetId);
}
```

Keep the existing direct-contact fallback messages and load the Turnstile script in `<head>`:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
```

- [ ] **Step 5: Run the focused contact test**

Run:

```bash
node --test --test-name-pattern='reviews page ends with' tests/html-integration.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the conversion flow**

```bash
git add anmeldelser/index.html tests/html-integration.test.mjs
git commit -m "Add contact conversion flow to reviews"
```

### Task 4: Publish, regress, and visually verify

**Files:**
- Modify: `sitemap.xml`
- Modify: `tests/html-integration.test.mjs`
- Verify: all changed HTML files

- [ ] **Step 1: Write the failing sitemap and page-count test**

Update the expected page count and add the sitemap assertion:

```js
assert.equal(files.length, 27);
```

```js
test('sitemap publishes the reviews page exactly once', async () => {
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/https:\/\/carupgrade\.dk\/anmeldelser\//g) || []).length, 1);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
node --test --test-name-pattern='every page includes|sitemap publishes the reviews' tests/html-integration.test.mjs
```

Expected: FAIL because the sitemap does not yet contain the new URL.

- [ ] **Step 3: Add the sitemap entry**

Add after the homepage URL:

```xml
<url>
  <loc>https://carupgrade.dk/anmeldelser/</loc>
  <lastmod>2026-07-02</lastmod>
</url>
```

- [ ] **Step 4: Run the full automated suite**

Run:

```bash
npm test
```

Expected: all tests PASS with zero failures.

- [ ] **Step 5: Run static integrity checks**

Run:

```bash
git diff --check
rg -n '3[,.]8|2 anmeldelser|href="\/?#anmeldelser"' --glob '*.html' .
```

Expected: `git diff --check` emits no output; the `rg` command emits no stale site content. Historical design documents are outside the HTML glob and do not affect this check.

- [ ] **Step 6: Serve and verify in a browser**

Run:

```bash
npx --yes serve . -l 4173
```

Verify `http://127.0.0.1:4173/` and `http://127.0.0.1:4173/anmeldelser/` at desktop and mobile widths. Confirm:

- Homepage section order flows directly from Why Us to Reparationer.
- Navigation order is Reparationer, Anmeldelser, Om Os.
- `/anmeldelser/` loads with no console errors.
- Four cards render without overflow.
- Trustpilot summary reads 4,0 and 4 anmeldelser.
- CTA scrolls to the contact form.
- Required fields expose browser validation.
- Turnstile reserves usable space and reports a clear fallback if unavailable locally.
- Focus states and mobile navigation remain usable.

- [ ] **Step 7: Commit publication and verification changes**

```bash
git add sitemap.xml tests/html-integration.test.mjs
git commit -m "Publish and verify reviews page"
```
