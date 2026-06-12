// portal.js — the client-facing side of file delivery: see your profile,
// download your footage. The only routes a CLIENT token can actually use.

import { Router } from 'express';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth); // valid JWT required; admins may pass through too

// GET /api/portal/me — own profile + delivered files. Always answers about
// the token's owner; there is no "me but someone else" parameter.
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { files: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!user) return res.status(404).json({ error: 'Account not found' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      projectLabel: user.projectLabel,
      notes: user.notes,
      mustResetPassword: user.mustResetPassword,
      files: user.files.map((file) => ({
        id: file.id,
        filename: file.filename,
        fileSize: file.fileSize.toString(), // BigInt → string; JSON refuses to discuss it
        uploadedAt: file.uploadedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/portal/files/:fileId — the authenticated download path, and the
// ONLY path. Client files are never static-served; the JWT must belong to
// the file's owner (or the admin). File ids are sequential, so the
// ownership check below is what stands between you and someone else's
// wedding footage.
router.get('/files/:fileId', async (req, res, next) => {
  try {
    const file = await prisma.clientFile.findUnique({
      where: { id: Number(req.params.fileId) },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (req.user.role !== 'ADMIN' && file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    // 410 Gone: the DB remembers the file, the disk does not. Someone
    // cleaned up /storage by hand — it happens.
    if (!fs.existsSync(file.filePath)) {
      return res.status(410).json({ error: 'File no longer exists on server' });
    }
    // res.download streams from disk and restores the original filename,
    // so the client gets "ceremony_4k.mp4" back, not our hex-suffixed one.
    res.download(file.filePath, file.filename);
  } catch (err) {
    next(err);
  }
});

export default router;
