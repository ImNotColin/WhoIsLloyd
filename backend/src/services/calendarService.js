import { google } from 'googleapis';
import prisma from '../lib/prisma.js';
import { slotToDateTimes } from '../utils/dateUtils.js';

const SERVICE_LABELS = {
  REAL_ESTATE: 'REAL ESTATE',
  EVENTS: 'EVENTS',
  CONSTRUCTION: 'CONSTRUCTION',
  WEDDINGS: 'WEDDINGS',
};

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

async function getRefreshToken() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return settings?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || null;
}

export async function calendarStatus() {
  if (!oauthConfigured()) return { configured: false, connected: false };
  return { configured: true, connected: Boolean(await getRefreshToken()) };
}

/** URL the admin visits to (re)connect Colin's Google Calendar. */
export function getAuthUrl() {
  if (!oauthConfigured()) return null;
  return makeOAuthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
}

/** OAuth callback: exchange code, persist refresh token server-side. */
export async function handleOAuthCallback(code) {
  const client = makeOAuthClient();
  const { tokens } = await client.getToken(code);
  if (tokens.refresh_token) {
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: { googleRefreshToken: tokens.refresh_token },
      create: { id: 1, googleRefreshToken: tokens.refresh_token },
    });
  }
  return Boolean(tokens.refresh_token);
}

async function getCalendarClient() {
  if (!oauthConfigured()) return null;
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  const auth = makeOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Creates the calendar event for a booking. Never throws — a calendar
 * outage must not break the booking flow. Returns the event id or null.
 */
export async function createBookingEvent(booking) {
  try {
    const calendar = await getCalendarClient();
    if (!calendar) {
      console.warn('[calendar] not connected — skipping event creation');
      return null;
    }
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

/** Best-effort removal of a booking's calendar event. */
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
    console.error('[calendar] event deletion failed:', err.message);
  }
}
