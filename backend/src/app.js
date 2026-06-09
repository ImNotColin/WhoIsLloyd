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
import { STORAGE_PATH } from './middleware/upload.js';

const app = express();

app.set('trust proxy', 1); // behind Nginx

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Public static assets: stock footage + portfolio media + FAA badge.
// In production Nginx serves these directly; this keeps dev working too.
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
// NOTE: /storage/uploads/clients is intentionally NOT static — client files
// are served only through the authenticated portal/admin endpoints.

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/availability', availabilityRoutes);
app.use('/api/admin/clients', clientRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api', portfolioRoutes); // /api/portfolio + /api/admin/portfolio
app.use('/api', testimonialRoutes); // /api/testimonials + /api/admin/testimonials
app.use('/api/contact', contactRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// 404 + error handling
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`DronesByColin API listening on :${port}`);
});

export default app;
