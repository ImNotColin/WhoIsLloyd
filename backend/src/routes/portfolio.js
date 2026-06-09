import { Router } from 'express';
import fs from 'fs/promises';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import { portfolioUpload, STORAGE_PATH } from '../middleware/upload.js';

const SERVICES = ['REAL_ESTATE', 'EVENTS', 'CONSTRUCTION', 'WEDDINGS'];

const router = Router();

/** Filesystem path -> public URL (remote placeholder URLs pass through). */
function toPublicUrl(p) {
  if (!p) return p;
  if (/^https?:\/\//.test(p)) return p;
  return p.startsWith(STORAGE_PATH)
    ? `/storage${p.slice(STORAGE_PATH.length)}`
    : p;
}

function itemView(item) {
  return {
    ...item,
    thumbnailPath: toPublicUrl(item.thumbnailPath),
    videoPath: toPublicUrl(item.videoPath),
  };
}

// GET /api/portfolio — public
router.get('/portfolio', async (_req, res, next) => {
  try {
    const items = await prisma.portfolioItem.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(items.map(itemView));
  } catch (err) {
    next(err);
  }
});

// --- Admin ---

const uploadFields = portfolioUpload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// POST /api/admin/portfolio
router.post('/admin/portfolio', auth, requireAdmin, uploadFields, async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().trim().min(1).max(160),
      category: z.enum(SERVICES),
      displayOrder: z.coerce.number().int().default(0),
      // Remote placeholder URLs are allowed when no file is uploaded
      thumbnailUrl: z.string().url().optional(),
      videoUrl: z.string().url().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    const { title, category, displayOrder, thumbnailUrl, videoUrl } = parsed.data;

    const thumbnailPath = req.files?.thumbnail?.[0]?.path || thumbnailUrl;
    const videoPath = req.files?.video?.[0]?.path || videoUrl;
    if (!thumbnailPath || !videoPath) {
      return res.status(400).json({ error: 'Thumbnail and video are both required' });
    }

    const item = await prisma.portfolioItem.create({
      data: { title, category, displayOrder, thumbnailPath, videoPath },
    });
    res.status(201).json(itemView(item));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/portfolio/:id
router.patch(
  '/admin/portfolio/:id',
  auth,
  requireAdmin,
  validate(
    z.object({
      title: z.string().trim().min(1).max(160).optional(),
      category: z.enum(SERVICES).optional(),
      displayOrder: z.coerce.number().int().optional(),
    })
  ),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.portfolioItem.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Item not found' });

      const item = await prisma.portfolioItem.update({ where: { id }, data: req.body });
      res.json(itemView(item));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/portfolio/:id
router.delete('/admin/portfolio/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.portfolioItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    await prisma.portfolioItem.delete({ where: { id } });
    // Clean up local files (remote placeholder URLs are skipped)
    for (const p of [existing.thumbnailPath, existing.videoPath]) {
      if (p && !/^https?:\/\//.test(p)) await fs.unlink(p).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
