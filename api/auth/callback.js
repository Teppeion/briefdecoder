import { exchangeCodeForUser } from '../../lib/feishu.js';
import { signSession, sessionCookie, parseCookies } from '../../lib/auth.js';

export default async function handler(req, res) {
  const { code, state } = req.query;
  const cookies = parseCookies(req.headers.cookie);

  if (!code) {
    return res.status(400).send('Missing code');
  }
  if (!state || state !== cookies.bd_state) {
    return res.status(400).send('State mismatch — please try logging in again.');
  }

  try {
    const user = await exchangeCodeForUser(code);
    const allowedTenant = process.env.FEISHU_ALLOWED_TENANT_KEY;

    if (allowedTenant && user.tenant_key !== allowedTenant) {
      return res.status(403).send(`
        <html><head><meta charset="utf-8"><title>访问受限</title></head>
        <body style="font-family:-apple-system,sans-serif;padding:60px;max-width:500px;margin:auto;">
          <h2>访问受限</h2>
          <p>此工具仅限蓝标飞书租户内成员使用。</p>
          <p style="color:#999;font-size:12px;margin-top:40px">
            你的 tenant_key: <code>${user.tenant_key}</code>
          </p>
        </body></html>
      `);
    }

    if (!allowedTenant) {
      console.log('[FEISHU] First-login tenant_key:', user.tenant_key,
        '→ add this to Vercel env var FEISHU_ALLOWED_TENANT_KEY');
    }

    const token = signSession({
      sub: user.open_id,
      name: user.name,
      email: user.enterprise_email || user.email || '',
      tenant: user.tenant_key
    });

    res.setHeader('Set-Cookie', [
      sessionCookie(token),
      'bd_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ]);
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (e) {
    res.status(500).send(`Login failed: ${e.message}`);
  }
}