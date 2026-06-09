import { Router } from 'express';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/portal/me — own profile + delivered files
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
      files: user.files.map((f) => ({
        id: f.id,
        filename: f.filename,
        fileSize: f.fileSize.toString(),
        uploadedAt: f.uploadedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/portal/files/:fileId — authenticated download.
// Client files are never publicly reachable; the JWT must belong to the
// file's owner (or an admin).
router.get('/files/:fileId', async (req, res, next) => {
  try {
    const file = await prisma.clientFile.findUnique({
      where: { id: Number(req.params.fileId) },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (req.user.role !== 'ADMIN' && file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!fs.existsSync(file.filePath)) {
      return res.status(410).json({ error: 'File no longer exists on server' });
    }
    res.download(file.filePath, file.filename);
  } catch (err) {
    next(err);
  }
});

export default router;
