// clients.js — admin-only client management: accounts, temporary passwords,
// and delivering the footage. There is no self-signup anywhere on this
// site; if you have a client account, Colin typed your name in himself.

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
router.use(auth, requireAdmin); // everything below is admin-only

/* ───── serializers ───── */

function serializeClient(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    projectLabel: user.projectLabel,
    notes: user.notes,
    mustResetPassword: user.mustResetPassword,
    createdAt: user.createdAt,
    files: user.files?.map(serializeFile),
  };
}

function serializeFile(file) {
  return {
    id: file.id,
    filename: file.filename,
    // BigInt because drone files outgrow Int32, stringified because
    // JSON.stringify throws at the sight of a BigInt.
    fileSize: file.fileSize.toString(),
    uploadedAt: file.uploadedAt,
  };
}

/* ───── account CRUD ───── */

// GET /api/admin/clients
router.get('/', async (_req, res, next) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: { files: { orderBy: { uploadedAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clients.map(serializeClient));
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

// POST /api/admin/clients — the ONLY way client accounts come into
// existence. Colin sets a temporary password and reads it to the client
// over the phone; mustResetPassword makes sure it stays temporary.
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { name, email, temporaryPassword, projectLabel, notes } = req.body;
    // Emails are stored lowercased so "Client@" and "client@" can't become
    // two accounts fighting over one inbox.
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
        password: await bcrypt.hash(temporaryPassword, 12), // slow by design
        role: 'CLIENT',
        projectLabel: projectLabel || null,
        notes: notes || null,
        mustResetPassword: true,
      },
    });
    res.status(201).json(serializeClient(user));
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
    // Scoped to role CLIENT — the admin account is not editable through
    // this route, even by the admin. Especially by the admin.
    const client = await prisma.user.findFirst({ where: { id, role: 'CLIENT' } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const { newPassword, forcePasswordReset, email, ...rest } = req.body;
    const updates = { ...rest };
    if (email) updates.email = email.toLowerCase();
    // An admin-set password is by definition temporary, so the reset flag
    // goes up with it...
    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 12);
      updates.mustResetPassword = true;
    }
    // ...unless the request says otherwise explicitly. Order matters:
    // forcePasswordReset wins over the newPassword default above.
    if (typeof forcePasswordReset === 'boolean') {
      updates.mustResetPassword = forcePasswordReset;
    }

    const user = await prisma.user.update({ where: { id }, data: updates });
    res.json(serializeClient(user));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/clients/:id — account, DB file records, and the files
// on disk. The whole project, gone, in that order.
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const client = await prisma.user.findFirst({
      where: { id, role: 'CLIENT' },
      include: { files: true },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    await prisma.user.delete({ where: { id } }); // cascades ClientFile rows
    // allSettled, not all: a file already missing from disk shouldn't turn
    // a successful account deletion into a 500.
    await Promise.allSettled(client.files.map((file) => fs.unlink(file.filePath)));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ───── delivery files ───── */

// POST /api/admin/clients/:id/files — upload deliverables into a client's
// portal, up to 20 at a time, up to 10GB apiece. Plan your evening.
router.post('/:id/files', clientUpload.array('files', 20), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const client = await prisma.user.findFirst({ where: { id, role: 'CLIENT' } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

    // We keep the client's original filename for display; the sanitized
    // randomized name lives in filePath where it can't hurt anyone.
    const created = await Promise.all(
      req.files.map((file) =>
        prisma.clientFile.create({
          data: {
            userId: id,
            filename: file.originalname,
            filePath: file.path,
            fileSize: BigInt(file.size),
          },
        })
      )
    );
    res.status(201).json(created.map(serializeFile));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/clients/:id/files/:fileId
router.delete('/:id/files/:fileId', async (req, res, next) => {
  try {
    // Both ids in the where clause, so a fileId can't be plucked out from
    // under a different client's account.
    const file = await prisma.clientFile.findFirst({
      where: { id: Number(req.params.fileId), userId: Number(req.params.id) },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await prisma.clientFile.delete({ where: { id: file.id } });
    await fs.unlink(file.filePath).catch(() => {}); // disk copy may already be gone
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
