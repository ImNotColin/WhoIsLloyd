// contact.js — the public contact form. One endpoint, rate-limited, that
// turns a website form into an email in Colin's inbox.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import { sendContactEmail, emailConfigured } from '../services/emailService.js';

const router = Router();

// 20 messages per 15 minutes per IP — roomy for humans, cramped for bots.
// Without this, the contact form is a free SMTP relay with extra steps.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Try again later.' },
});

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  message: z.string().trim().min(10).max(5000),
});

// POST /api/contact
router.post('/', contactLimiter, validate(schema), async (req, res, next) => {
  try {
    // If Gmail credentials aren't configured, say so up front and hand out
    // the direct contact info — better than silently eating the message.
    if (!emailConfigured()) {
      return res.status(503).json({
        error:
          'Messaging is temporarily unavailable. Call (903) 520-9328 or email DronesByColin@gmail.com.',
      });
    }
    await sendContactEmail(req.body);
    res.json({ ok: true, message: "Message sent. We'll get back to you soon." });
  } catch (err) {
    next(err);
  }
});

export default router;
