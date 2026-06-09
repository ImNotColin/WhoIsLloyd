import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import validate from '../middleware/validate.js';
import {
  buildMonthAvailability,
  dayFlagFor,
  isValidDateString,
  minBookableDate,
  toUTCDate,
  dateToString,
} from '../utils/dateUtils.js';
import {
  sendBookingConfirmation,
  sendBookingNotification,
} from '../services/emailService.js';
import {
  createBookingEvent,
  deleteBookingEvent,
} from '../services/calendarService.js';

const SERVICES = ['REAL_ESTATE', 'EVENTS', 'CONSTRUCTION', 'WEDDINGS'];
const SLOTS = ['AM', 'PM'];
const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

async function getAvailabilitySettings() {
  return (
    (await prisma.availabilitySettings.findUnique({ where: { id: 1 } })) ?? {
      mondayOn: false,
      tuesdayOn: false,
      wednesdayOn: false,
      thursdayOn: false,
      fridayOn: false,
      saturdayOn: true,
      sundayOn: true,
    }
  );
}

// ---------- PUBLIC ----------

const router = Router();

// GET /api/bookings/availability?month=YYYY-MM
router.get('/availability', async (req, res, next) => {
  try {
    const month = String(req.query.month || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ error: 'month must be YYYY-MM' });
    }

    const monthStart = toUTCDate(`${month}-01`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    const [settings, blocked, bookings] = await Promise.all([
      getAvailabilitySettings(),
      prisma.blockedDate.findMany({
        where: { date: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.booking.findMany({
        where: {
          date: { gte: monthStart, lt: monthEnd },
          status: { not: 'CANCELLED' },
        },
        select: { date: true, slot: true },
      }),
    ]);

    const bookingsByDate = new Map();
    for (const b of bookings) {
      const key = dateToString(b.date);
      if (!bookingsByDate.has(key)) bookingsByDate.set(key, new Set());
      bookingsByDate.get(key).add(b.slot);
    }

    res.json({
      month,
      minBookableDate: minBookableDate(),
      days: buildMonthAvailability(
        month,
        settings,
        blocked.map((b) => dateToString(b.date)),
        bookingsByDate
      ),
    });
  } catch (err) {
    next(err);
  }
});

const bookingSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  service: z.enum(SERVICES),
  slot: z.enum(SLOTS),
  date: z.string().refine(isValidDateString, 'date must be YYYY-MM-DD'),
  notes: z
    .string()
    .trim()
    .min(20, 'Please describe your shoot in at least 20 characters')
    .max(5000),
});

// POST /api/bookings
router.post('/', validate(bookingSchema), async (req, res, next) => {
  try {
    const { date, slot } = req.body;

    // Business rule 1: hard 7-day advance block (also enforced in frontend)
    if (date < minBookableDate()) {
      return res.status(400).json({
        error:
          'Bookings require at least 7 days notice. Call (903) 520-9328 for short-notice shoots.',
      });
    }

    // Rules 5 & 6: day-of-week availability + blocked dates
    const settings = await getAvailabilitySettings();
    if (!settings[dayFlagFor(date)]) {
      return res.status(400).json({ error: 'That day is not available for bookings.' });
    }
    const isBlocked = await prisma.blockedDate.findUnique({
      where: { date: toUTCDate(date) },
    });
    if (isBlocked) {
      return res.status(400).json({ error: 'That date is unavailable.' });
    }

    // Rule 2: one booking per slot, max two per day
    const slotTaken = await prisma.booking.findFirst({
      where: { date: toUTCDate(date), slot, status: { not: 'CANCELLED' } },
    });
    if (slotTaken) {
      return res.status(409).json({ error: 'That slot was just taken. Pick another.' });
    }

    const booking = await prisma.booking.create({
      data: { ...req.body, date: toUTCDate(date) },
    });

    // Rules 8–10: emails + calendar event (best-effort; booking already saved)
    const gcalEventId = await createBookingEvent(booking);
    if (gcalEventId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { gcalEventId } });
    }
    sendBookingConfirmation(booking).catch((e) =>
      console.error('[email] confirmation failed:', e.message)
    );
    sendBookingNotification(booking).catch((e) =>
      console.error('[email] notification failed:', e.message)
    );

    res.status(201).json({
      id: booking.id,
      message: "We'll call you before your shoot day to go over the details.",
    });
  } catch (err) {
    next(err);
  }
});

// ---------- ADMIN ----------

export const adminRouter = Router();
adminRouter.use(auth, requireAdmin);

// GET /api/admin/bookings
adminRouter.get('/', async (_req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/bookings/:id
adminRouter.patch(
  '/:id',
  validate(z.object({ status: z.enum(STATUSES) })),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.booking.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Booking not found' });

      const booking = await prisma.booking.update({
        where: { id },
        data: { status: req.body.status },
      });
      if (req.body.status === 'CANCELLED' && existing.gcalEventId) {
        deleteBookingEvent(existing.gcalEventId);
      }
      res.json(booking);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/bookings/:id
adminRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    await prisma.booking.delete({ where: { id } });
    if (existing.gcalEventId) deleteBookingEvent(existing.gcalEventId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
