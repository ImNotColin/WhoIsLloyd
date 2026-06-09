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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

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
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) return res.status(401).json({ error: 'Account no longer exists' });

      res.json({ ...signTokens(user), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

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

      const ok = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(req.body.newPassword, 12),
          mustResetPassword: false,
        },
      });
      res.json({ user: publicUser(updated) });
    } catch (err) {
      next(err);
    }
  }
);

// --- Google Calendar OAuth (admin connects Colin's calendar) ---

router.get('/google', auth, requireAdmin, (req, res) => {
  const url = getAuthUrl();
  if (!url) {
    return res
      .status(503)
      .json({ error: 'Google OAuth credentials are not configured' });
  }
  res.json({ url });
});

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
