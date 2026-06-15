// settings.js — site-wide settings: contact info shown in the footer, the
// Part 107 license image, and a read-only view of the Google Calendar
// connection. One row, id 1, forever.

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import { part107Upload, STORAGE_PATH } from '../middleware/upload.js';
import { calendarStatus } from '../services/calendarService.js';

const router = Router();

/* ───── helpers ───── */

// The public shape of the settings row. googleRefreshToken is conspicuously
// not in this list and must never be — this view goes out on an
// unauthenticated endpoint.
function serializeSettings(row) {
  return {
    phone: row.phone,
    email: row.email,
    instagram: row.instagram,
    businessHours: row.businessHours,
    part107Path: row.part107Path
      ? `/storage${row.part107Path.slice(STORAGE_PATH.length)}`
      : null,
  };
}

// Singleton row, created on first touch with the schema defaults.
async function getSettings() {
  return prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

/* ───── public ───── */

// GET /api/admin/settings/public — used by the public site for the footer
// and contact info. No auth. Route order is load-bearing: this MUST stay
// above the router.use(auth, ...) line below, or the homepage starts
// demanding a login to display a phone number.
router.get('/public', async (_req, res, next) => {
  try {
    res.json(serializeSettings(await getSettings()));
  } catch (err) {
    next(err);
  }
});

/* ───── admin (everything below this line) ───── */

router.use(auth, requireAdmin);

// GET /api/admin/settings — same view plus calendar connection status.
router.get('/', async (_req, res, next) => {
  try {
    const [settings, calendar] = await Promise.all([getSettings(), calendarStatus()]);
    res.json({ ...serializeSettings(settings), calendar });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  phone: z.string().trim().min(7).max(30).optional(),
  email: z.string().trim().email().optional(),
  instagram: z.string().trim().min(1).max(60).optional(),
  businessHours: z.string().trim().max(300).optional(),
});

// PUT /api/admin/settings
router.put('/', validate(updateSchema), async (req, res, next) => {
  try {
    await getSettings(); // make sure row 1 exists before updating it
    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: req.body,
    });
    res.json(serializeSettings(settings));
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/settings/part107 — upload the FAA Part 107 license image.
// Proof Colin is legal to fly; the public site shows it off, the FAA
// presumably approves.
router.post('/part107', part107Upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    await getSettings();
    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: { part107Path: req.file.path },
    });
    res.json(serializeSettings(settings));
  } catch (err) {
    next(err);
  }
});

export default router;
