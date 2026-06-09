import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import { isValidDateString, toUTCDate, dateToString } from '../utils/dateUtils.js';

const router = Router();
router.use(auth, requireAdmin);

// GET /api/admin/availability
router.get('/', async (_req, res, next) => {
  try {
    const [settings, blocked] = await Promise.all([
      prisma.availabilitySettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
      }),
      prisma.blockedDate.findMany({ orderBy: { date: 'asc' } }),
    ]);
    res.json({
      settings,
      blockedDates: blocked.map((b) => ({ id: b.id, date: dateToString(b.date) })),
    });
  } catch (err) {
    next(err);
  }
});

const daysSchema = z.object({
  mondayOn: z.boolean(),
  tuesdayOn: z.boolean(),
  wednesdayOn: z.boolean(),
  thursdayOn: z.boolean(),
  fridayOn: z.boolean(),
  saturdayOn: z.boolean(),
  sundayOn: z.boolean(),
});

// PUT /api/admin/availability
router.put('/', validate(daysSchema), async (req, res, next) => {
  try {
    const settings = await prisma.availabilitySettings.upsert({
      where: { id: 1 },
      update: req.body,
      create: { id: 1, ...req.body },
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/availability/block
router.post(
  '/block',
  validate(z.object({ date: z.string().refine(isValidDateString, 'date must be YYYY-MM-DD') })),
  async (req, res, next) => {
    try {
      const blocked = await prisma.blockedDate.upsert({
        where: { date: toUTCDate(req.body.date) },
        update: {},
        create: { date: toUTCDate(req.body.date) },
      });
      res.status(201).json({ id: blocked.id, date: dateToString(blocked.date) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/availability/block/:id
router.delete('/block/:id', async (req, res, next) => {
  try {
    await prisma.blockedDate.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    next(err);
  }
});

export default router;
