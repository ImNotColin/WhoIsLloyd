// requireAdmin.js — the cockpit door. Clients can ride in the back; the
// admin panel is pilot-in-command only, and there is exactly one pilot.

/** Must run after auth(). Rejects non-admin tokens. */
export default function requireAdmin(req, res, next) {
  // The req.user check is belt-and-suspenders: if this ever runs without
  // auth() first, we fail closed rather than crash on undefined.
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
