// app.js — the wiring diagram. Every route, guard, and static mount for the
// Drones by Colin API gets bolted on here, in an order that matters more
// than it looks like it does.

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth.js';
import bookingRoutes, { adminRouter as adminBookingRoutes } from './routes/bookings.js';
import availabilityRoutes from './routes/availability.js';
import clientRoutes from './routes/clients.js';
import portalRoutes from './routes/portal.js';
import portfolioRoutes from './routes/portfolio.js';
import testimonialRoutes from './routes/testimonials.js';
import contactRoutes from './routes/contact.js';
import settingsRoutes from './routes/settings.js';
import bloopersRoutes from './routes/bloopers.js';
import { STORAGE_PATH } from './middleware/upload.js';

const app = express();

/* ───── platform & security middleware ───── */

// We sit behind Nginx, which terminates TLS and hands us X-Forwarded-For.
// Without this, the rate limiters would happily throttle Nginx itself,
// which has done nothing wrong.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : true,
  })
);
// 1MB JSON cap. The big payloads here are video files, and those go through
// multipart uploads — anyone sending a 1MB JSON body is up to something.
app.use(express.json({ limit: '1mb' }));

/* ───── public static assets ───── */

// Stock footage, portfolio media, and the FAA Part 107 badge. In production
// Nginx serves these straight off disk; these mounts exist so dev works
// without standing up a reverse proxy first.
app.use(
  '/storage/stock',
  express.static(path.join(STORAGE_PATH, 'stock'), { maxAge: '7d' })
);
app.use(
  '/storage/uploads/portfolio',
  express.static(path.join(STORAGE_PATH, 'uploads/portfolio'), { maxAge: '7d' })
);
app.use(
  '/storage/uploads/settings',
  express.static(path.join(STORAGE_PATH, 'uploads/settings'), { maxAge: '1d' })
);
app.use(
  '/storage/uploads/bloopers',
  express.static(path.join(STORAGE_PATH, 'uploads/bloopers'), { maxAge: '7d' })
);
// /storage/uploads/clients is deliberately absent. Client deliverables are a
// no-fly zone for static serving — they only leave the building through the
// authenticated portal/admin endpoints, which check who's asking.

/* ───── API routes ───── */

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/availability', availabilityRoutes);
app.use('/api/admin/clients', clientRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api', portfolioRoutes); // /api/portfolio + /api/admin/portfolio
app.use('/api', testimonialRoutes); // /api/testimonials + /api/admin/testimonials
app.use('/api', bloopersRoutes);   // /api/bloopers + /api/admin/bloopers
app.use('/api/contact', contactRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* ───── 404 + error handling ───── */

// Anything under /api that fell through every router above lands here.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Last line of defense. Express identifies an error handler by its arity,
// so all four parameters stay even though `next` just sits there.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Oversized payloads get a 413 instead of a stack trace. With 10GB upload
  // limits in play, "too large" is a category of error we take seriously.
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  // Log the real error for us; send a deliberately boring message to them.
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ───── liftoff ───── */

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`DronesByColin API listening on :${port}`);
});

export default app;
