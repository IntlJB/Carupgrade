# Google Analytics Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add consent-gated Google Analytics measurement `G-130SMNH86Q` to every Carupgrade page, with a bottom consent bar, persistent choice, footer settings link, and accurate policy text.

**Architecture:** A shared browser script owns consent storage, banner rendering, and conditional `gtag.js` loading. A shared stylesheet owns the responsive banner design. Every static HTML page references those assets once and provides a footer link that resets consent and reloads the page.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, JSDOM for DOM behavior tests, npm.

---

## File map

- Create `assets/cookie-consent.js`: consent state, accessible banner, settings-link handling, and conditional Analytics loading.
- Create `assets/cookie-consent.css`: bottom-bar layout, Carupgrade styling, responsive behavior, and focus states.
- Create `tests/cookie-consent.test.mjs`: browser behavior tests in JSDOM.
- Create `tests/html-integration.test.mjs`: repository-wide assertions for all HTML pages and policy wording.
- Modify `package.json` and `package-lock.json`: add JSDOM and the test script.
- Modify all 17 `index.html` files: reference shared assets and add the footer settings link.
- Modify `cookiepolitik/index.html`: document consent-gated Google Analytics.
- Modify `privatlivspolitik/index.html`: remove the statement that tracking is not used and explain consent-gated analytics.
- Modify `.gitignore`: ignore the local `.superpowers/` visual-brainstorming artifacts.

### Task 1: Establish the automated test harness and repository-wide contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/html-integration.test.mjs`
- Modify: `.gitignore`

- [ ] **Step 1: Ignore local visual-brainstorming artifacts**

Add this line to `.gitignore`:

```gitignore
.superpowers/
```

- [ ] **Step 2: Install the DOM test dependency and add the test command**

Run:

```bash
npm install --save-dev jsdom
```

Add to `package.json`:

```json
"scripts": {
  "test": "node --test"
}
```

- [ ] **Step 3: Write the failing HTML integration test**

Create `tests/html-integration.test.mjs`:

```javascript
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

async function findHtmlFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['.git', '.superpowers', 'node_modules'].includes(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findHtmlFiles(absolutePath));
    if (entry.isFile() && entry.name === 'index.html') files.push(absolutePath);
  }

  return files.sort();
}

test('every page includes one consent stylesheet, script, and settings link', async () => {
  const files = await findHtmlFiles();
  assert.equal(files.length, 17);

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
```

- [ ] **Step 4: Run the integration test and verify RED**

Run:

```bash
npm test -- tests/html-integration.test.mjs
```

Expected: FAIL because the 17 pages do not yet reference the shared assets or settings link.

### Task 2: Implement consent behavior test-first

**Files:**
- Create: `tests/cookie-consent.test.mjs`
- Create: `assets/cookie-consent.js`

- [ ] **Step 1: Write failing behavior tests**

Create `tests/cookie-consent.test.mjs`:

```javascript
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const scriptPath = path.resolve(import.meta.dirname, '../assets/cookie-consent.js');
const storageKey = 'carupgrade_cookie_consent_v1';

async function createPage(consent) {
  const source = await readFile(scriptPath, 'utf8');
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><footer><a href="#" data-cookie-settings>Cookieindstillinger</a></footer></body></html>',
    { runScripts: 'outside-only', url: 'https://carupgrade.dk/' }
  );

  if (consent) dom.window.localStorage.setItem(storageKey, consent);
  dom.window.eval(source);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}

test('shows the banner and does not load Google before a choice', async () => {
  const dom = await createPage();
  assert.ok(dom.window.document.querySelector('[data-cookie-banner]'));
  assert.equal(dom.window.document.querySelector('script[data-google-tag]'), null);
});

test('accept stores consent and loads exactly one Google tag', async () => {
  const dom = await createPage();
  dom.window.document.querySelector('[data-cookie-accept]').click();
  dom.window.document.querySelector('[data-cookie-accept]')?.click();

  assert.equal(dom.window.localStorage.getItem(storageKey), 'accepted');
  const scripts = dom.window.document.querySelectorAll('script[data-google-tag]');
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /G-130SMNH86Q/);
  assert.equal(dom.window.document.querySelector('[data-cookie-banner]'), null);
});

test('reject stores consent without loading Google', async () => {
  const dom = await createPage();
  dom.window.document.querySelector('[data-cookie-reject]').click();

  assert.equal(dom.window.localStorage.getItem(storageKey), 'rejected');
  assert.equal(dom.window.document.querySelector('script[data-google-tag]'), null);
  assert.equal(dom.window.document.querySelector('[data-cookie-banner]'), null);
});

test('stored acceptance loads Google and stored rejection does not', async () => {
  const accepted = await createPage('accepted');
  const rejected = await createPage('rejected');

  assert.equal(accepted.window.document.querySelectorAll('script[data-google-tag]').length, 1);
  assert.equal(rejected.window.document.querySelector('script[data-google-tag]'), null);
  assert.equal(rejected.window.document.querySelector('[data-cookie-banner]'), null);
});

test('settings link clears the choice before reload', async () => {
  const dom = await createPage('rejected');
  let reloaded = false;
  dom.window.__carupgradeReload = () => { reloaded = true; };
  dom.window.document.querySelector('[data-cookie-settings]').click();

  assert.equal(dom.window.localStorage.getItem(storageKey), null);
  assert.equal(reloaded, true);
});
```

- [ ] **Step 2: Run the behavior tests and verify RED**

Run:

```bash
npm test -- tests/cookie-consent.test.mjs
```

Expected: FAIL because `assets/cookie-consent.js` does not exist.

- [ ] **Step 3: Implement the minimal consent controller**

Create `assets/cookie-consent.js`:

```javascript
(() => {
  const measurementId = 'G-130SMNH86Q';
  const storageKey = 'carupgrade_cookie_consent_v1';

  function readConsent() {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      if (value === null) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, value);
    } catch {
      // The current page can still honor the choice when storage is unavailable.
    }
  }

  function loadAnalytics() {
    if (document.querySelector('script[data-google-tag]')) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.googleTag = measurementId;
    document.head.append(script);
  }

  function removeBanner() {
    document.querySelector('[data-cookie-banner]')?.remove();
  }

  function showBanner() {
    if (document.querySelector('[data-cookie-banner]')) return;

    const banner = document.createElement('section');
    banner.className = 'cookie-consent';
    banner.dataset.cookieBanner = '';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookie-consent-title');
    banner.innerHTML = `
      <div class="cookie-consent__content">
        <div class="cookie-consent__copy">
          <h2 id="cookie-consent-title">Vi bruger statistikcookies</h2>
          <p>Med dit samtykke bruger vi Google Analytics til at forstå trafikken og forbedre hjemmesiden. <a href="/cookiepolitik/">Læs cookiepolitikken</a>.</p>
        </div>
        <div class="cookie-consent__actions">
          <button type="button" class="cookie-consent__button cookie-consent__button--secondary" data-cookie-reject>Afvis</button>
          <button type="button" class="cookie-consent__button cookie-consent__button--primary" data-cookie-accept>Accepter</button>
        </div>
      </div>`;

    banner.querySelector('[data-cookie-reject]').addEventListener('click', () => {
      writeConsent('rejected');
      removeBanner();
    });
    banner.querySelector('[data-cookie-accept]').addEventListener('click', () => {
      writeConsent('accepted');
      loadAnalytics();
      removeBanner();
    });
    document.body.append(banner);
    banner.querySelector('[data-cookie-reject]').focus();
  }

  function bindSettingsLinks() {
    document.querySelectorAll('[data-cookie-settings]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        writeConsent(null);
        if (typeof window.__carupgradeReload === 'function') window.__carupgradeReload();
        else window.location.reload();
      });
    });
  }

  function init() {
    bindSettingsLinks();
    const consent = readConsent();
    if (consent === 'accepted') loadAnalytics();
    else if (consent !== 'rejected') showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
```

- [ ] **Step 4: Run behavior tests and verify GREEN**

Run:

```bash
npm test -- tests/cookie-consent.test.mjs
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit the tested controller**

```bash
git add .gitignore package.json package-lock.json tests/cookie-consent.test.mjs tests/html-integration.test.mjs assets/cookie-consent.js
git commit -m "Add consent-gated analytics controller"
```

### Task 3: Add the approved bottom-bar presentation

**Files:**
- Create: `assets/cookie-consent.css`
- Modify: `tests/html-integration.test.mjs`

- [ ] **Step 1: Extend the integration test with CSS accessibility contracts**

Add:

```javascript
test('consent stylesheet contains responsive and keyboard-focus states', async () => {
  const css = await readFile(path.join(root, 'assets/cookie-consent.css'), 'utf8');
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /bottom:\s*0/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media/);
});
```

- [ ] **Step 2: Run the CSS contract and verify RED**

Run:

```bash
npm test -- tests/html-integration.test.mjs
```

Expected: FAIL because `assets/cookie-consent.css` does not exist.

- [ ] **Step 3: Create the shared stylesheet**

Create `assets/cookie-consent.css`:

```css
.cookie-consent {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10000;
  padding: 18px 24px;
  color: #fff;
  background: #181818;
  border-top: 1px solid #333;
  box-shadow: 0 -8px 28px rgb(0 0 0 / 50%);
  font-family: 'DM Sans', sans-serif;
}

.cookie-consent__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  gap: 28px;
}

.cookie-consent__copy h2 {
  margin: 0 0 4px;
  color: #fff;
  font: 700 22px/1.2 'Barlow Condensed', sans-serif;
}

.cookie-consent__copy p { margin: 0; color: #bbb; font-size: 14px; line-height: 1.5; }
.cookie-consent__copy a { color: #fff; text-decoration: underline; }
.cookie-consent__actions { display: flex; flex: 0 0 auto; gap: 10px; }

.cookie-consent__button {
  min-width: 120px;
  padding: 11px 18px;
  border: 1px solid #777;
  border-radius: 0;
  color: #fff;
  background: transparent;
  cursor: pointer;
  font: 700 15px/1 'DM Sans', sans-serif;
}

.cookie-consent__button--primary { border-color: #d91b38; background: #d91b38; }
.cookie-consent__button:hover { border-color: #fff; }
.cookie-consent__button--primary:hover { background: #a8132a; }
.cookie-consent__button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }

@media (max-width: 700px) {
  .cookie-consent { padding: 16px; }
  .cookie-consent__content { align-items: stretch; flex-direction: column; gap: 14px; }
  .cookie-consent__actions { width: 100%; }
  .cookie-consent__button { flex: 1; min-width: 0; }
}
```

- [ ] **Step 4: Run the contract and verify GREEN**

Run:

```bash
npm test -- tests/html-integration.test.mjs
```

Expected: the CSS test passes; the page-integration test still fails until Task 4.

- [ ] **Step 5: Commit the presentation**

```bash
git add assets/cookie-consent.css tests/html-integration.test.mjs
git commit -m "Style analytics consent banner"
```

### Task 4: Wire consent assets and settings links into every page

**Files:**
- Modify: `index.html`
- Modify: `FAQ/index.html`
- Modify: `autovaerksted-vaerloese/index.html`
- Modify: `bilservice-hjemme/index.html`
- Modify: `biludstyr-og-infotainment/index.html`
- Modify: `bremser/index.html`
- Modify: `cookiepolitik/index.html`
- Modify: `fejlfinding-bil/index.html`
- Modify: `handels-og-garantibestemmelser/index.html`
- Modify: `mobil-mekaniker-koebenhavn/index.html`
- Modify: `mobil-mekaniker-vaerloese/index.html`
- Modify: `mobil-mekaniker/index.html`
- Modify: `mobilt-vaerksted-sjaelland/index.html`
- Modify: `mobilt-vaerksted/index.html`
- Modify: `olieskift-hjemme/index.html`
- Modify: `privatlivspolitik/index.html`
- Modify: `serviceeftersyn-bil/index.html`

- [ ] **Step 1: Add the shared assets once to each `<head>`**

Immediately after `<head>` in every file, add:

```html
<link rel="stylesheet" href="/assets/cookie-consent.css">
<script src="/assets/cookie-consent.js" defer></script>
```

- [ ] **Step 2: Add the settings link once to each footer**

In full four-column footers, add this directly after the Cookiepolitik list item:

```html
<li><a href="#cookieindstillinger" data-cookie-settings>Cookieindstillinger</a></li>
```

In compact landing-page footers, add an equivalent anchor inside `<footer>` before `</footer>`:

```html
<a href="#cookieindstillinger" data-cookie-settings>Cookieindstillinger</a>
```

- [ ] **Step 3: Run the repository-wide integration test**

Run:

```bash
npm test -- tests/html-integration.test.mjs
```

Expected: the “every page” test passes; the policy test may remain red until Task 5.

- [ ] **Step 4: Commit the page wiring**

```bash
git add index.html */index.html
git commit -m "Enable consent controls on every page"
```

### Task 5: Update cookie and privacy disclosures

**Files:**
- Modify: `cookiepolitik/index.html`
- Modify: `privatlivspolitik/index.html`
- Modify: `tests/html-integration.test.mjs`

- [ ] **Step 1: Replace obsolete cookie-policy claims**

Replace the current “no cookies/no Analytics” wording in sections 3, 4, 6, 7, and 9 with this content, retaining the page’s existing section wrappers and heading hierarchy:

```html
<h2>3. Statistikcookies på Carupgrade.dk</h2>
<p>Carupgrade bruger Google Analytics 4 som valgfrit statistikværktøj. Google Analytics aktiveres kun, hvis du vælger <strong>Accepter</strong> i cookiebanneret. Hvis du vælger <strong>Afvis</strong>, indlæses Google Analytics ikke, og der sendes ingen analyticsdata fra hjemmesiden til Google.</p>
<p>Formålet er at udarbejde statistik om besøg og brug af hjemmesiden, så Carupgrade kan forstå trafikken og forbedre indhold og brugeroplevelse. Carupgrades målings-id er <code>G-130SMNH86Q</code>.</p>

<h2>4. Cookies fra Google Analytics</h2>
<p>Google Analytics leveres af Google Ireland Limited. Når du har givet samtykke, kan Google Analytics sætte førstepartscookies, herunder <code>_ga</code>, som bruges til at skelne mellem brugere, og <code>_ga_&lt;container-id&gt;</code>, som bruges til at bevare sessionsstatus. Google oplyser en standardudløbstid på 2 år for disse cookies; browserindstillinger og Carupgrades Analytics-konfiguration kan begrænse perioden.</p>
<p>Læs Googles aktuelle beskrivelse under <a href="https://support.google.com/analytics/answer/11397207" target="_blank" rel="noopener">Cookie usage on websites</a>.</p>

<h2>6. Tredjepart og behandling af oplysninger</h2>
<p>Når Google Analytics er aktiveret efter dit samtykke, modtager Google oplysninger om brugen af hjemmesiden. Google beskriver sin behandling og sine sikkerhedsforanstaltninger i <a href="https://support.google.com/analytics/answer/6004245" target="_blank" rel="noopener">Analytics-dokumentationen</a> og <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Googles privatlivspolitik</a>.</p>

<h2>7. Samtykke og tilbagekaldelse</h2>
<p>Ved første besøg kan du vælge <strong>Afvis</strong> eller <strong>Accepter</strong>. Valget gemmes lokalt i din browser, så hjemmesiden kan huske det. Du kan til enhver tid trække dit samtykke tilbage eller vælge igen via linket <strong>Cookieindstillinger</strong> i footeren.</p>
<p>Når du åbner Cookieindstillinger, nulstilles det tidligere valg, og siden genindlæses uden Google Analytics. Google Analytics aktiveres først igen, hvis du vælger Accepter.</p>

<h2>9. Ændringer i cookiepolitikken</h2>
<p>Carupgrade opdaterer cookiepolitikken, hvis hjemmesidens brug af cookies, statistikværktøjer eller tredjepartsleverandører ændres. Ved væsentlige ændringer kan Carupgrade bede dig om at afgive et nyt samtykke.</p>
```

Set the policy’s “last updated” date to `19. juni 2026`.

- [ ] **Step 2: Replace the obsolete privacy-policy statement**

In section 11, retain the existing heading and replace both paragraphs with:

```html
<p>Carupgrades brug af cookies og Google Analytics er beskrevet i Carupgrades <a href="/cookiepolitik/">cookiepolitik</a>.</p>
<p>Google Analytics anvendes til trafikstatistik og forbedring af hjemmesiden, men aktiveres kun, hvis den besøgende giver samtykke. Samtykke kan afvises eller trækkes tilbage via <strong>Cookieindstillinger</strong> i footeren.</p>
```

- [ ] **Step 3: Run policy and full tests**

Run:

```bash
npm test
```

Expected: all behavior and integration tests pass.

- [ ] **Step 4: Commit the legal-copy update**

```bash
git add cookiepolitik/index.html privatlivspolitik/index.html tests/html-integration.test.mjs
git commit -m "Update analytics privacy disclosures"
```

### Task 6: End-to-end and visual verification

**Files:**
- Modify only if verification exposes a defect.

- [ ] **Step 1: Start the static site locally**

Run:

```bash
npx --yes serve .
```

Expected: a local URL serving `index.html` and nested routes.

- [ ] **Step 2: Verify the first-visit flow in the browser**

Clear site storage, load the homepage, and verify:

- the approved bottom bar is visible on desktop and mobile;
- no request to `googletagmanager.com` occurs before a choice;
- keyboard focus lands on **Afvis** and both buttons are keyboard-operable;
- the cookie-policy link works.

- [ ] **Step 3: Verify rejection**

Select **Afvis**, navigate across at least three different route types, and verify the banner stays hidden and no Google tag or request appears.

- [ ] **Step 4: Verify acceptance and idempotency**

Clear storage, select **Accepter**, and verify exactly one script with URL `https://www.googletagmanager.com/gtag/js?id=G-130SMNH86Q` exists and Analytics remains enabled after navigation.

- [ ] **Step 5: Verify withdrawal**

Use **Cookieindstillinger**, verify the page reloads and shows the banner without loading Google, then select **Afvis** and confirm the rejected state persists.

- [ ] **Step 6: Run final automated verification**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: all tests pass, `git diff --check` prints nothing, and only intended files are modified or committed.

- [ ] **Step 7: Commit any verification fixes**

If verification required changes, stage only those files and commit:

```bash
git commit -m "Fix analytics consent verification issues"
```
