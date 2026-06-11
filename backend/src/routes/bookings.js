// bookings.js — the money route. Public availability lookups and booking
// creation up top, admin booking management below. Every business rule the
// frontend enforces is re-enforced here, because the frontend is a
// suggestion and this file is the law.

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

// Settings row with a fallback matching the schema defaults (weekends on),
// so availability math works even before the seed script has ever run.
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

/* ───── public ───── */

const router = Router();

// GET /api/bookings/availability?month=YYYY-MM
// Powers the booking calendar: which days exist, which are open, and why
// the closed ones are closed.
router.get('/availability', async (req, res, next) => {
  try {
    const month = String(req.query.month || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ error: 'month must be YYYY-MM' });
    }

    // Half-open range [monthStart, nextMonthStart) in UTC. setUTCMonth
    // handles December → January without ceremony.
    const monthStart = toUTCDate(`${month}-01`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    const [settings, blocked, bookings] = await Promise.all([
      getAvailabilitySettings(),
      prisma.blockedDate.findMany({
        where: { date: { gte: monthStart, lt: monthEnd } },
      }),
      // Cancelled bookings free their slot — that's the whole point of
      // cancelling.
      prisma.booking.findMany({
        where: {
          date: { gte: monthStart, lt: monthEnd },
          status: { not: 'CANCELLED' },
        },
        select: { date: true, slot: true },
      }),
    ]);

    // Fold bookings into Map<"YYYY-MM-DD", Set<"AM"|"PM">> of taken slots.
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
  // 20-character minimum on notes: "house" is not a shot list.
  notes: z
    .string()
    .trim()
    .min(20, 'Please describe your shoot in at least 20 characters')
    .max(5000),
});

// POST /api/bookings — the gauntlet. Each business rule gets its own check
// and its own honest error message.
router.post('/', validate(bookingSchema), async (req, res, next) => {
  try {
    const { date, slot } = req.body;

    // Rule 1: the 7-day advance window. The drone could be there tomorrow;
    // Colin's calendar could not. String comparison is safe because both
    // sides are YYYY-MM-DD. (Also enforced in the frontend, which we
    // politely assume someone has bypassed.)
    if (date < minBookableDate()) {
      return res.status(400).json({
        error:
          'Bookings require at least 7 days notice. Call (903) 520-9328 for short-notice shoots.',
      });
    }

    // Rules 5 & 6: day-of-week availability + admin-blocked dates.
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

    // Rule 2: one booking per slot, so at most two shoots a day. The 409
    // covers the race where someone else grabbed the slot while this user
    // was composing their notes.
    const slotTaken = await prisma.booking.findFirst({
      where: { date: toUTCDate(date), slot, status: { not: 'CANCELLED' } },
    });
    if (slotTaken) {
      return res.status(409).json({ error: 'That slot was just taken. Pick another.' });
    }

    const booking = await prisma.booking.create({
      data: { ...req.body, date: toUTCDate(date) },
    });

    // Rules 8–10: calendar event + emails, all best-effort. The booking is
    // already committed; if Google or Gmail is having a day, that is their
    // problem, not the client's.
    const gcalEventId = await createBookingEvent(booking);
    if (gcalEventId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { gcalEventId } });
    }
    // Fire-and-forget with logging — deliberately not awaited, so a slow
    // SMTP handshake doesn't hold the 201 hostage.
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

/* ───── admin ───── */

export const adminRouter = Router();
adminRouter.use(auth, requireAdmin);

// GET /api/admin/bookings — everything, soonest first.
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

// PATCH /api/admin/bookings/:id — status transitions only. Editing a
// booking's date or client details isn't a thing; cancel and rebook.
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
      // Cancelling pulls the event off Colin's calendar too. Best-effort,
      // not awaited — the cancellation stands either way.
      if (req.body.status === 'CANCELLED' && existing.gcalEventId) {
        deleteBookingEvent(existing.gcalEventId);
      }
      res.json(booking);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/bookings/:id — hard delete, calendar event included.
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
