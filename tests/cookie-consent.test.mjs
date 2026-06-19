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
