const FEISHU_BASE = 'https://open.feishu.cn';

let cachedTenantToken = null;
let cachedTenantTokenExpiry = 0;
let cachedBitableAppToken = null;

export async function getTenantAccessToken() {
  if (cachedTenantToken && Date.now() < cachedTenantTokenExpiry) {
    return cachedTenantToken;
  }
  const r = await fetch(`${FEISHU_BASE}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });
  const data = await r.json();
  if (data.code !== 0) throw new Error(`tenant_access_token failed: ${data.msg}`);
  cachedTenantToken = data.tenant_access_token;
  cachedTenantTokenExpiry = Date.now() + (data.expire - 60) * 1000;
  return cachedTenantToken;
}

export async function getAppAccessToken() {
  const r = await fetch(`${FEISHU_BASE}/open-apis/auth/v3/app_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });
  const data = await r.json();
  if (data.code !== 0) throw new Error(`app_access_token failed: ${data.msg}`);
  return data.app_access_token;
}

export async function exchangeCodeForUser(code) {
  const appToken = await getAppAccessToken();
  const r = await fetch(`${FEISHU_BASE}/open-apis/authen/v1/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appToken}`
    },
    body: JSON.stringify({ grant_type: 'authorization_code', code })
  });
  const data = await r.json();
  if (data.code !== 0) throw new Error(`user access_token failed: ${data.msg}`);
  return data.data;
}

// 把 wiki_token 换成真正的 bitable app_token
async function resolveWikiToObjToken(wikiToken) {
  if (cachedBitableAppToken) return cachedBitableAppToken;
  const token = await getTenantAccessToken();
  const r = await fetch(
    `${FEISHU_BASE}/open-apis/wiki/v2/spaces/get_node?token=${wikiToken}&obj_type=wiki`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await r.json();
  if (data.code !== 0) throw new Error(`wiki resolve failed: ${data.msg} (code ${data.code})`);
  cachedBitableAppToken = data.data.node.obj_token;
  return cachedBitableAppToken;
}

export async function writeBitableRecord(fields) {
  const token = await getTenantAccessToken();
  const wikiToken = process.env.FEISHU_WIKI_TOKEN;
  const tableId = process.env.FEISHU_BITABLE_TABLE_ID;
  if (!wikiToken || !tableId) throw new Error('Bitable env vars missing');

  const appToken = await resolveWikiToObjToken(wikiToken);

  const url = `${FEISHU_BASE}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fields })
  });
  const data = await r.json();
  if (data.code !== 0) throw new Error(`bitable write failed: ${data.msg} (code ${data.code})`);
  return data.data;
}