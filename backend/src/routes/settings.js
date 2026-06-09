import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import { part107Upload, STORAGE_PATH } from '../middleware/upload.js';
import { calendarStatus } from '../services/calendarService.js';

const router = Router();

function settingsView(s) {
  return {
    phone: s.phone,
    email: s.email,
    instagram: s.instagram,
    businessHours: s.businessHours,
    part107Path: s.part107Path
      ? `/storage${s.part107Path.slice(STORAGE_PATH.length)}`
      : null,
  };
}

async function getSettings() {
  return prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

// GET /api/admin/settings/public — used by the public site (no auth).
// Mounted before the auth guard below.
router.get('/public', async (_req, res, next) => {
  try {
    res.json(settingsView(await getSettings()));
  } catch (err) {
    next(err);
  }
});

router.use(auth, requireAdmin);

// GET /api/admin/settings
router.get('/', async (_req, res, next) => {
  try {
    const [settings, calendar] = await Promise.all([getSettings(), calendarStatus()]);
    res.json({ ...settingsView(settings), calendar });
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
    await getSettings();
    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: req.body,
    });
    res.json(settingsView(settings));
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/settings/part107 — upload FAA license image
router.post('/part107', part107Upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    await getSettings();
    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: { part107Path: req.file.path },
    });
    res.json(settingsView(settings));
  } catch (err) {
    next(err);
  }
});

export default router;
