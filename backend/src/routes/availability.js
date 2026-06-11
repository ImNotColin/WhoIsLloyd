// availability.js — admin controls for when the drone flies: which weekdays
// are bookable, plus one-off blocked dates for holidays, weather, and the
// occasional weekend Colin defends for himself.

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import { isValidDateString, toUTCDate, dateToString } from '../utils/dateUtils.js';

const router = Router();
router.use(auth, requireAdmin); // whole router is admin-only — no exceptions below

/* ───── weekday settings ───── */

// GET /api/admin/availability
router.get('/', async (_req, res, next) => {
  try {
    // upsert-with-empty-update: fetch the singleton settings row, creating
    // it with schema defaults (weekends on) the first time anyone asks.
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

// All seven flags are required on update — partial day submissions are how
// you end up mysteriously closed on Wednesdays.
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

/* ───── blocked dates ───── */

// POST /api/admin/availability/block
router.post(
  '/block',
  validate(z.object({ date: z.string().refine(isValidDateString, 'date must be YYYY-MM-DD') })),
  async (req, res, next) => {
    try {
      // Upsert keeps this idempotent: blocking an already-blocked date is
      // a shrug, not a unique-constraint error.
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
    // P2025 is Prisma for "record not found" — a clean 404, not a crash.
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    next(err);
  }
});

export default router;
