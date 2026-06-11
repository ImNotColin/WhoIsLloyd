// auth.js — JWT checkpoint. No valid boarding pass, no entry; we don't even
// look up who you claim to be.

import jwt from 'jsonwebtoken';

/** Verifies the access token and attaches { id, role } to req.user. */
export default function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    // verify() checks both the signature and the expiry. Access tokens live
    // ~15 minutes, so "it worked a minute ago" is a perfectly normal way
    // to land here — clients are expected to refresh and retry.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    // Forged, mangled, or expired — same 401 either way. We don't help
    // callers debug which part of their bad token was bad.
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
