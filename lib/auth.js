import crypto from 'crypto';

const COOKIE_NAME = 'bd_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function signSession(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  const now = Math.floor(Date.now() / 1000);
  const data = { ...payload, iat: now, exp: now + MAX_AGE };
  const body = b64urlEncode(JSON.stringify(data));
  const sig = b64urlEncode(crypto.createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token) {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = b64urlEncode(crypto.createHmac('sha256', secret).update(body).digest());
  if (sig.length !== expected.length) return null;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (mismatch !== 0) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k] = decodeURIComponent(v.join('='));
  });
  return cookies;
}

export function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySession(cookies[COOKIE_NAME]);
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };