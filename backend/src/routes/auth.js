// auth.js — login, token refresh, password changes, and the Google Calendar
// OAuth handshake. The most security-sensitive file in the repo, so the
// jokes are kept to cruising altitude.

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import { getAuthUrl, handleOAuthCallback } from '../services/calendarService.js';

const router = Router();

/* ───── helpers ───── */

// 10 attempts per 15 minutes per IP. Generous enough for a forgotten
// password, hostile enough for a dictionary.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

// Two tokens, two secrets, two lifespans: a short-lived access token (~15m)
// for actual requests and a long-lived refresh token (~7d) whose only job
// is minting new access tokens. Losing one is an inconvenience, not a key
// to the building.
function signTokens(user) {
  const payload = { id: user.id, role: user.role };
  return {
    accessToken: jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    }),
    refreshToken: jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    }),
  };
}

// The user object as the frontend is allowed to see it. Notably absent:
// the password hash. Allowlist, not blocklist — new columns stay private
// until someone decides otherwise.
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    projectLabel: user.projectLabel,
    mustResetPassword: user.mustResetPassword,
  };
}

/* ───── login & tokens ───── */

router.post(
  '/login',
  authLimiter,
  validate(
    z.object({ email: z.string().email(), password: z.string().min(1) })
  ),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      // Same 401 whether the email is unknown or the password is wrong —
      // no free account enumeration. bcrypt.compare does the slow part.
      const ok = user && (await bcrypt.compare(password, user.password));
      if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

      res.json({ ...signTokens(user), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/refresh',
  validate(z.object({ refreshToken: z.string().min(1) })),
  async (req, res, next) => {
    try {
      let payload;
      try {
        payload = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      // Re-fetch the user instead of trusting the 7-day-old payload: if
      // Colin deleted the client account on Tuesday, their token stops
      // working on Tuesday, not next week.
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) return res.status(401).json({ error: 'Account no longer exists' });

      res.json({ ...signTokens(user), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

/* ───── password change ───── */

router.post(
  '/change-password',
  auth,
  validate(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    })
  ),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) return res.status(401).json({ error: 'Account not found' });

      // A valid JWT is not enough to change a password — you have to know
      // the current one. A borrowed laptop shouldn't be a full takeover.
      const ok = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          // bcrypt, 12 rounds — slow on purpose, like a pre-flight checklist.
          password: await bcrypt.hash(req.body.newPassword, 12),
          // This change-password flow is also how clients clear their
          // temporary-password flag, so lower it here.
          mustResetPassword: false,
        },
      });
      res.json({ user: publicUser(updated) });
    } catch (err) {
      next(err);
    }
  }
);

/* ───── Google Calendar OAuth (admin connects Colin's calendar) ───── */

// Step 1: hand the admin panel a Google consent URL. 503 if the OAuth env
// vars were never set — that's a deployment problem, not a user problem.
router.get('/google', auth, requireAdmin, (req, res) => {
  const url = getAuthUrl();
  if (!url) {
    return res
      .status(503)
      .json({ error: 'Google OAuth credentials are not configured' });
  }
  res.json({ url });
});

// Step 2: Google redirects back here. No auth middleware — Google isn't
// carrying our JWT — and the code itself is single-use proof of consent.
// We bounce back to the admin settings page with the outcome in the query
// string; `no_refresh_token` means Google decided we'd consented before
// and kept the refresh token to itself (revoke app access and retry).
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing authorization code');
    const stored = await handleOAuthCallback(String(code));
    const base = process.env.FRONTEND_URL || '';
    res.redirect(`${base}/admin/settings?calendar=${stored ? 'connected' : 'no_refresh_token'}`);
  } catch (err) {
    next(err);
  }
});

export default router;
