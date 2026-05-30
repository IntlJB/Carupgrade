import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';

const successMessage = 'Tak for din henvendelse. Vi vender tilbage hurtigst muligt ellers ring direkte på +45 31 14 77 37.';
const errorMessage = 'Der opstod en fejl. Prøv igen eller kontakt os direkte på info@carupgrade.dk eller ring til os på +45 31 14 77 37.';
const spamSuccessMessage = successMessage;
const rateLimitWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 4;
const rateLimitStore = globalThis.__carupgradeRateLimitStore || new Map();

globalThis.__carupgradeRateLimitStore = rateLimitStore;

function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  return rawBody ? JSON.parse(rawBody) : {};
}

function getField(body, ...keys) {
  for (const key of keys) {
    if (typeof body[key] === 'string' && body[key].trim()) {
      return body[key].trim();
    }
  }

  return '';
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const firstForwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    firstForwardedIp?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function isRateLimited(identifier) {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) rateLimitStore.delete(key);
  }

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }

  current.count += 1;
  rateLimitStore.set(identifier, current);

  return current.count > maxRequestsPerWindow;
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch (error) {
    return false;
  }
}

async function verifyTurnstile(token, ip) {
  if (!process.env.TURNSTILE_SECRET_KEY || !token) return false;

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: ip,
    idempotency_key: randomUUID()
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body
  });

  if (!response.ok) return false;

  const result = await response.json();
  return Boolean(result.success && result.action === 'contact');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatLine(label, value) {
  return `<p><strong>${label}:</strong> ${escapeHtml(value || 'Ikke angivet')}</p>`;
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ ok: false, message: errorMessage });
  }

  if (!isSameOrigin(req)) {
    return res.status(403).json({ ok: false, message: errorMessage });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return res.status(400).json({ ok: false, message: 'Ugyldig JSON-body.' });
  }

  const name = getField(body, 'name', 'navn');
  const email = getField(body, 'email');
  const phone = getField(body, 'phone', 'telefon');
  const message = getField(body, 'message', 'besked');
  const service = getField(body, 'service', 'ydelse');
  const car = getField(body, 'car', 'nummerplade');
  const honeypot = getField(body, 'website', 'url', 'company');
  const turnstileToken = getField(body, 'cf-turnstile-response', 'turnstileToken');

  if (honeypot) {
    return res.status(200).json({ ok: true, message: spamSuccessMessage });
  }

  const clientIp = getClientIp(req);

  if (isRateLimited(clientIp)) {
    return res.status(429).json({ ok: false, message: 'Der er sendt for mange forespørgsler. Prøv igen om lidt.' });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'Navn, email og besked skal udfyldes.' });
  }

  const turnstileIsValid = await verifyTurnstile(turnstileToken, clientIp);

  if (!turnstileIsValid) {
    return res.status(400).json({ ok: false, message: 'Sikkerhedstjekket kunne ikke gennemføres. Genindlæs siden og prøv igen.' });
  }

  const html = [
    '<h2>Ny henvendelse fra Carupgrade.dk</h2>',
    formatLine('Navn', name),
    formatLine('Email', email),
    formatLine('Telefon', phone),
    car ? formatLine('Nummerplade', car) : '',
    service ? formatLine('Service/ydelse', service) : '',
    formatLine('Besked', message).replaceAll('\n', '<br>')
  ].filter(Boolean).join('');

  const text = [
    'Ny henvendelse fra Carupgrade.dk',
    `Navn: ${name}`,
    `Email: ${email}`,
    `Telefon: ${phone || 'Ikke angivet'}`,
    car ? `Nummerplade: ${car}` : '',
    service ? `Service/ydelse: ${service}` : '',
    `Besked: ${message}`
  ].filter(Boolean).join('\n');

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Carupgrade <kontakt@carupgrade.dk>',
      to: 'info@carupgrade.dk',
      replyTo: email,
      subject: 'Ny henvendelse fra Carupgrade.dk',
      html,
      text
    });

    if (error) {
      return res.status(500).json({ ok: false, message: errorMessage });
    }

    return res.status(200).json({ ok: true, message: successMessage });
  } catch (error) {
    return res.status(500).json({ ok: false, message: errorMessage });
  }
}
