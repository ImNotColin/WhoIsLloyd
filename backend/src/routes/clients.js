import { Router } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import { clientUpload } from '../middleware/upload.js';

const router = Router();
router.use(auth, requireAdmin);

function clientView(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    projectLabel: user.projectLabel,
    notes: user.notes,
    mustResetPassword: user.mustResetPassword,
    createdAt: user.createdAt,
    files: user.files?.map(fileView),
  };
}

function fileView(f) {
  return {
    id: f.id,
    filename: f.filename,
    fileSize: f.fileSize.toString(), // BigInt isn't JSON-serializable
    uploadedAt: f.uploadedAt,
  };
}

// GET /api/admin/clients
router.get('/', async (_req, res, next) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: { files: { orderBy: { uploadedAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clients.map(clientView));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  temporaryPassword: z.string().min(8, 'Temporary password must be at least 8 characters'),
  projectLabel: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});

// POST /api/admin/clients — the ONLY way client accounts are created
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { name, email, temporaryPassword, projectLabel, notes } = req.body;
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: await bcrypt.hash(temporaryPassword, 12),
        role: 'CLIENT',
        projectLabel: projectLabel || null,
        notes: notes || null,
        mustResetPassword: true,
      },
    });
    res.status(201).json(clientView(user));
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  projectLabel: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  newPassword: z.string().min(8).optional(), // admin password reset
  forcePasswordReset: z.boolean().optional(),
});

// PATCH /api/admin/clients/:id
router.patch('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const client = await prisma.user.findFirst({ where: { id, role: 'CLIENT' } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const { newPassword, forcePasswordReset, email, ...rest } = req.body;
    const data = { ...rest };
    if (email) data.email = email.toLowerCase();
    if (newPassword) {
      data.password = await bcrypt.hash(newPassword, 12);
      data.mustResetPassword = true;
    }
    if (typeof forcePasswordReset === 'boolean') {
      data.mustResetPassword = forcePasswordReset;
    }

    const user = await prisma.user.update({ where: { id }, data });
    res.json(clientView(user));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/clients/:id — removes account, DB file records, and files on disk
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const client = await prisma.user.findFirst({
      where: { id, role: 'CLIENT' },
      include: { files: true },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    await prisma.user.delete({ where: { id } }); // cascades ClientFile rows
    await Promise.allSettled(client.files.map((f) => fs.unlink(f.filePath)));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/clients/:id/files — upload delivery files to a client's portal
router.post('/:id/files', clientUpload.array('files', 20), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const client = await prisma.user.findFirst({ where: { id, role: 'CLIENT' } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const created = await Promise.all(
      req.files.map((f) =>
        prisma.clientFile.create({
          data: {
            userId: id,
            filename: f.originalname,
            filePath: f.path,
            fileSize: BigInt(f.size),
          },
        })
      )
    );
    res.status(201).json(created.map(fileView));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/clients/:id/files/:fileId
router.delete('/:id/files/:fileId', async (req, res, next) => {
  try {
    const file = await prisma.clientFile.findFirst({
      where: { id: Number(req.params.fileId), userId: Number(req.params.id) },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await prisma.clientFile.delete({ where: { id: file.id } });
    await fs.unlink(file.filePath).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
