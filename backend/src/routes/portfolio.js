// portfolio.js — the showreel. Public read of the portfolio grid, plus
// admin CRUD for uploading the real footage that replaces the seeded
// placeholder clips.

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

/* ───── view helpers ───── */

/** Filesystem path -> public URL (remote placeholder URLs pass through). */
function toPublicUrl(mediaPath) {
  if (!mediaPath) return mediaPath;
  if (/^https?:\/\//.test(mediaPath)) return mediaPath; // seeded Pexels placeholder — already a URL
  return mediaPath.startsWith(STORAGE_PATH)
    ? `/storage${mediaPath.slice(STORAGE_PATH.length)}`
    : mediaPath;
}

function serializeItem(item) {
  return {
    ...item,
    thumbnailPath: toPublicUrl(item.thumbnailPath),
    videoPath: toPublicUrl(item.videoPath),
  };
}

/* ───── public ───── */

// GET /api/portfolio
router.get('/portfolio', async (_req, res, next) => {
  try {
    const reel = await prisma.portfolioItem.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(reel.map(serializeItem));
  } catch (err) {
    next(err);
  }
});

/* ───── admin ───── */

const uploadFields = portfolioUpload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// POST /api/admin/portfolio
// Multipart, so Multer must run before we can validate the text fields —
// req.body is empty until the (potentially multi-gigabyte) upload finishes
// parsing. That's why the zod check is inline here instead of using the
// validate() middleware.
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

    // Uploaded file wins; remote URL is the fallback. One way or another,
    // a portfolio item without both a thumbnail and a video is not a
    // portfolio item.
    const thumbnailPath = req.files?.thumbnail?.[0]?.path || thumbnailUrl;
    const videoPath = req.files?.video?.[0]?.path || videoUrl;
    if (!thumbnailPath || !videoPath) {
      return res.status(400).json({ error: 'Thumbnail and video are both required' });
    }

    const created = await prisma.portfolioItem.create({
      data: { title, category, displayOrder, thumbnailPath, videoPath },
    });
    res.status(201).json(serializeItem(created));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/portfolio/:id — metadata only. Swapping the actual
// media means deleting and re-uploading; nobody re-edits a 10GB file
// in place.
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

      const updated = await prisma.portfolioItem.update({ where: { id }, data: req.body });
      res.json(serializeItem(updated));
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
    // Reclaim the disk space — gigabytes at a time around here. Remote
    // placeholder URLs are skipped; Pexels can keep their own files.
    for (const mediaPath of [existing.thumbnailPath, existing.videoPath]) {
      if (mediaPath && !/^https?:\/\//.test(mediaPath)) await fs.unlink(mediaPath).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
