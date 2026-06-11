// calendarService.js — keeps Colin's Google Calendar in sync with bookings.
// Design rule throughout: the calendar is a convenience, the booking is the
// contract. Nothing in here is allowed to crash a booking.

import { google } from 'googleapis';
import prisma from '../lib/prisma.js';
import { slotToDateTimes } from '../utils/dateUtils.js';

// Uppercase on purpose — these are the event titles Colin reads at a
// glance on his phone in a parking lot.
const SERVICE_LABELS = {
  REAL_ESTATE: 'REAL ESTATE',
  EVENTS: 'EVENTS',
  CONSTRUCTION: 'CONSTRUCTION',
  WEDDINGS: 'WEDDINGS',
};

/* ───── OAuth plumbing ───── */

function oauthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function makeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// The refresh token lives in the DB first, env var second. DB-first means
// Colin can reconnect his calendar from the admin panel without anyone
// SSH-ing in to edit .env; the env var survives as a bootstrap fallback.
async function getRefreshToken() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return settings?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || null;
}

// "configured" = the env vars exist; "connected" = someone actually
// finished the OAuth dance. The admin panel renders these differently.
export async function calendarStatus() {
  if (!oauthConfigured()) return { configured: false, connected: false };
  return { configured: true, connected: Boolean(await getRefreshToken()) };
}

/** URL the admin visits to (re)connect Colin's Google Calendar. */
export function getAuthUrl() {
  if (!oauthConfigured()) return null;
  return makeOAuthClient().generateAuthUrl({
    // offline + consent is what coaxes a refresh token out of Google.
    // Omit either and Google assumes you didn't really mean it.
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
}

/** OAuth callback: exchange code, persist refresh token server-side. */
export async function handleOAuthCallback(code) {
  const client = makeOAuthClient();
  const { tokens } = await client.getToken(code);
  // Google only includes refresh_token on a fresh consent. If it's absent
  // we keep whatever we already have and report false so the UI can tell
  // the admin to revoke and retry.
  if (tokens.refresh_token) {
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: { googleRefreshToken: tokens.refresh_token },
      create: { id: 1, googleRefreshToken: tokens.refresh_token },
    });
  }
  return Boolean(tokens.refresh_token);
}

// Returns a ready-to-fly calendar client, or null if OAuth isn't set up or
// connected. Callers treat null as "skip calendar, carry on".
async function getCalendarClient() {
  if (!oauthConfigured()) return null;
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  const auth = makeOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth });
}

/* ───── event operations ───── */

/**
 * Creates the calendar event for a booking. Never throws — a Google outage
 * downgrades us to "Colin checks the admin panel", not "client loses their
 * booking". Returns the event id or null.
 */
export async function createBookingEvent(booking) {
  try {
    const calendar = await getCalendarClient();
    if (!calendar) {
      console.warn('[calendar] not connected — skipping event creation');
      return null;
    }
    // booking.date is UTC midnight in the DB; slotToDateTimes pins the
    // event to Central Time wall-clock hours so it shows up when the
    // shoot actually is, not when UTC thinks it is.
    const dateStr = booking.date.toISOString().slice(0, 10);
    const { start, end } = slotToDateTimes(dateStr, booking.slot);
    const res = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: {
        summary: `${SERVICE_LABELS[booking.service]} — ${booking.clientName}`,
        description: `Phone: ${booking.phone}\nEmail: ${booking.email}\nNotes: ${booking.notes}`,
        start,
        end,
      },
    });
    return res.data.id || null;
  } catch (err) {
    console.error('[calendar] event creation failed:', err.message);
    return null;
  }
}

/** Best-effort removal of a booking's calendar event. Same rule: log, never throw. */
export async function deleteBookingEvent(eventId) {
  if (!eventId) return;
  try {
    const calendar = await getCalendarClient();
    if (!calendar) return;
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId,
    });
  } catch (err) {
    // Worst case: a ghost event lingers on the calendar and Colin deletes
    // it by hand. Annoying, survivable.
    console.error('[calendar] event deletion failed:', err.message);
  }
}
