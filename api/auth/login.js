import crypto from 'crypto';

export default function handler(req, res) {
  const appId = process.env.FEISHU_APP_ID;
  const redirectUri = process.env.FEISHU_REDIRECT_URI;
  if (!appId || !redirectUri) {
    return res.status(500).send('FEISHU_APP_ID or FEISHU_REDIRECT_URI not configured');
  }

  const state = crypto.randomBytes(16).toString('hex');

  const authUrl = `https://open.feishu.cn/open-apis/authen/v1/index?` +
    `redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&app_id=${appId}` +
    `&state=${state}`;

  res.setHeader('Set-Cookie',
    `bd_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.writeHead(302, { Location: authUrl });
  res.end();
}