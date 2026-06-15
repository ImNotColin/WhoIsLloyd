// bloopers.js — the outtake reel. Publicly readable, admin-only writable,
// and accessed only by those who know the secret handshake.

import { Router } from 'express';
import fs from 'fs/promises';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import { blooperUpload, STORAGE_PATH } from '../middleware/upload.js';

const router = Router();

/* ───── helpers ───── */

// Filesystem path → public URL. Same pattern as portfolio — local paths
// get rewritten; anything already HTTP is left alone.
function toPublicUrl(p) {
  if (!p) return p;
  if (/^https?:\/\//.test(p)) return p;
  return p.startsWith(STORAGE_PATH) ? `/storage${p.slice(STORAGE_PATH.length)}` : p;
}

function serialize(blooper) {
  return { ...blooper, videoPath: toPublicUrl(blooper.videoPath) };
}

const videoField = blooperUpload.fields([{ name: 'video', maxCount: 1 }]);

/* ───── public ───── */

// GET /api/bloopers — no auth, newest first. The page is hard to find;
// the endpoint itself is not a secret.
router.get('/bloopers', async (_req, res, next) => {
  try {
    const bloopers = await prisma.blooper.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bloopers.map(serialize));
  } catch (err) {
    next(err);
  }
});

/* ───── admin ───── */

// POST /api/admin/bloopers — multipart, video required.
router.post('/admin/bloopers', auth, requireAdmin, videoField, async (req, res, next) => {
  try {
    const schema = z.object({ title: z.string().trim().min(1).max(160) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    const videoPath = req.files?.video?.[0]?.path;
    if (!videoPath) return res.status(400).json({ error: 'Video file is required' });

    const created = await prisma.blooper.create({
      data: { title: parsed.data.title, videoPath },
    });
    res.status(201).json(serialize(created));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/bloopers/:id — title only. Replacing the video means
// deleting and re-uploading, same policy as portfolio.
router.patch('/admin/bloopers/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.blooper.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Blooper not found' });

    const schema = z.object({ title: z.string().trim().min(1).max(160) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const updated = await prisma.blooper.update({ where: { id }, data: parsed.data });
    res.json(serialize(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/bloopers/:id — removes record and reclaims disk.
router.delete('/admin/bloopers/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.blooper.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Blooper not found' });

    await prisma.blooper.delete({ where: { id } });
    if (existing.videoPath && !/^https?:\/\//.test(existing.videoPath)) {
      await fs.unlink(existing.videoPath).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
