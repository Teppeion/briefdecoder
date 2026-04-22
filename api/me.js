import { getSession } from '../lib/auth.js';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.status(200).json({
    name: session.name,
    email: session.email,
    open_id: session.sub
  });
}