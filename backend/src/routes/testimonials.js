// testimonials.js — kind words from clients. Public read of the visible
// ones; admin CRUD for all of them, including the `visible` switch that
// quietly retires a quote without deleting it.

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';

const SERVICES = ['REAL_ESTATE', 'EVENTS', 'CONSTRUCTION', 'WEDDINGS'];

const router = Router();

/* ───── public ───── */

// GET /api/testimonials — visible only. The filter is the entire privacy
// model here; the public never learns what's hidden.
router.get('/testimonials', async (_req, res, next) => {
  try {
    const items = await prisma.testimonial.findMany({
      where: { visible: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

/* ───── admin ───── */

// GET /api/admin/testimonials — all of them, hidden included.
router.get('/admin/testimonials', auth, requireAdmin, async (_req, res, next) => {
  try {
    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  service: z.enum(SERVICES),
  quote: z.string().trim().min(10).max(2000),
  // Stars are 1–5, defaulting to 5 — Colin enters these himself, and
  // nobody transcribes their own three-star review.
  rating: z.coerce.number().int().min(1).max(5).default(5),
  visible: z.boolean().default(true),
});

// POST /api/admin/testimonials
router.post('/admin/testimonials', auth, requireAdmin, validate(createSchema), async (req, res, next) => {
  try {
    const item = await prisma.testimonial.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/testimonials/:id — any subset of fields; flipping
// `visible` is the usual reason to be here.
router.patch(
  '/admin/testimonials/:id',
  auth,
  requireAdmin,
  validate(createSchema.partial()),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.testimonial.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Testimonial not found' });

      const item = await prisma.testimonial.update({ where: { id }, data: req.body });
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/testimonials/:id
router.delete('/admin/testimonials/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Testimonial not found' });

    await prisma.testimonial.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
