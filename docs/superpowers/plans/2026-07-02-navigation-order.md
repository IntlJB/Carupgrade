# Navigation Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place “Sådan fungerer det” before “Services” in every primary navigation.

**Architecture:** Keep the static HTML structure unchanged apart from swapping the first two navigation list items. Verify the rendered source order with a Node assertion against each page's `nav-links` list.

**Tech Stack:** Static HTML, Node.js verification script

---

### Task 1: Reorder the primary navigation links

**Files:**
- Modify: `index.html:1354-1355`
- Modify: `cookiepolitik/index.html:364-365`
- Modify: `privatlivspolitik/index.html:364-365`
- Modify: `handels-og-garantibestemmelser/index.html:372-373`
- Modify: `FAQ/index.html:482-483`
- Modify: `om-os/index.html:369-370`

- [ ] **Step 1: Run the order assertion and verify it fails**

```bash
node - <<'NODE'
const fs = require('fs');
const files = ['index.html', 'cookiepolitik/index.html', 'privatlivspolitik/index.html', 'handels-og-garantibestemmelser/index.html', 'FAQ/index.html', 'om-os/index.html'];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const nav = html.match(/<ul class="nav-links" id="navLinks">([\s\S]*?)<\/ul>/)?.[1] ?? '';
  if (!(nav.indexOf('Sådan fungerer det') < nav.indexOf('Services'))) throw new Error(`${file}: wrong primary navigation order`);
}
NODE
```

Expected: FAIL on `index.html` because “Services” currently occurs first.

- [ ] **Step 2: Swap the two list items in every primary navigation**

Use this order on the homepage:

```html
<li><a href="#hvordan">Sådan fungerer det</a></li>
<li><a href="#services">Services</a></li>
```

Use the equivalent root-prefixed links (`/#hvordan` and `/#services`) on secondary pages.

- [ ] **Step 3: Run the order assertion and verify it passes**

Run the Node command from Step 1.

Expected: PASS with exit code 0 and no output.

- [ ] **Step 4: Verify formatting and scope**

```bash
git diff --check
git diff -- index.html cookiepolitik/index.html privatlivspolitik/index.html handels-og-garantibestemmelser/index.html FAQ/index.html om-os/index.html
```

Expected: no whitespace errors; only the two navigation list items are swapped in each file.

- [ ] **Step 5: Commit the implementation**

```bash
git add docs/superpowers/plans/2026-07-02-navigation-order.md index.html cookiepolitik/index.html privatlivspolitik/index.html handels-og-garantibestemmelser/index.html FAQ/index.html om-os/index.html
git commit -m "Match navigation to homepage layout"
```
