// dateUtils.js — all the date math, quarantined in one file so the time
// zone bugs at least know where to report.
//
// The treaty that keeps the peace:
//   - A booking date is a plain "YYYY-MM-DD" string, stored as a
//     UTC-midnight DateTime. It means "that calendar day in Texas" and
//     carries no time-of-day information, whatever the DB column implies.
//   - Slot wall-clock times are fixed in Central Time. Google Calendar is
//     told the time zone explicitly and does the conversion; we don't.
// Break either rule and bookings start drifting a day around midnight,
// which is exactly as fun to debug as it sounds.

export const SLOT_TIMES = {
  AM: { start: '08:00', end: '12:00', label: 'Morning (8am–12pm)' },
  PM: { start: '13:00', end: '17:00', label: 'Afternoon (1pm–5pm)' },
};

export const MIN_ADVANCE_DAYS = 7;
export const TIME_ZONE = 'America/Chicago';

// Indexed by getUTCDay(): Sunday is 0, because JavaScript.
const DAY_FLAGS = [
  'sundayOn',
  'mondayOn',
  'tuesdayOn',
  'wednesdayOn',
  'thursdayOn',
  'fridayOn',
  'saturdayOn',
];

/* ───── primitives ───── */

/**
 * Today's date in Central Time as "YYYY-MM-DD". The server runs on UTC,
 * where it is tomorrow for six hours every evening; Colin operates in
 * Texas, where it is not. en-CA is the one locale that formats dates as
 * YYYY-MM-DD out of the box — thank you, Canada.
 */
export function todayCT() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Shape check, then a round-trip through Date to catch the impostors:
// "2026-02-30" matches the regex but does not match February.
export function isValidDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const roundTrip = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(roundTrip.getTime()) && roundTrip.toISOString().startsWith(s);
}

/** "YYYY-MM-DD" -> Date at UTC midnight (canonical DB representation). */
export function toUTCDate(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// Inverse of toUTCDate. Only safe on UTC-midnight dates — feed it anything
// else and the ISO slice may land on the wrong side of midnight.
export function dateToString(date) {
  return date.toISOString().slice(0, 10);
}

// Date arithmetic on strings, via UTC, where days are reliably 24 hours.
// setUTCDate handles month and year rollover; no DST cliff to fall off.
export function addDays(dateStr, days) {
  const date = toUTCDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToString(date);
}

/* ───── booking rules ───── */

/** First bookable date: strictly more than MIN_ADVANCE_DAYS-1 days out. */
export function minBookableDate() {
  return addDays(todayCT(), MIN_ADVANCE_DAYS);
}

/** Day-of-week availability flag name for a "YYYY-MM-DD" string. */
export function dayFlagFor(dateStr) {
  return DAY_FLAGS[toUTCDate(dateStr).getUTCDay()];
}

/** All "YYYY-MM-DD" strings in a "YYYY-MM" month. */
export function datesInMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  // Day 0 of the NEXT month is the last day of this one — the oldest
  // trick in the Date book, and it knows about leap years so we don't
  // have to.
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) =>
    `${monthStr}-${String(i + 1).padStart(2, '0')}`
  );
}

/**
 * Builds the availability picture for one month. Reasons are checked in
 * precedence order — a blocked Tuesday in three days reads TOO_SOON, since
 * that's the rule the client hits first.
 *
 * @param monthStr        "YYYY-MM"
 * @param settings        AvailabilitySettings row
 * @param blockedDates    array of "YYYY-MM-DD"
 * @param bookingsByDate  Map<"YYYY-MM-DD", Set<"AM"|"PM">> of taken slots
 * @returns [{ date, am, pm, reason? }]
 */
export function buildMonthAvailability(
  monthStr,
  settings,
  blockedDates,
  bookingsByDate
) {
  const minDate = minBookableDate();
  const blocked = new Set(blockedDates);

  return datesInMonth(monthStr).map((date) => {
    // YYYY-MM-DD sorts lexicographically the same as chronologically —
    // the single best property a date format ever had.
    if (date < minDate) {
      return { date, am: false, pm: false, reason: 'TOO_SOON' };
    }
    if (!settings[dayFlagFor(date)]) {
      return { date, am: false, pm: false, reason: 'DAY_OFF' };
    }
    if (blocked.has(date)) {
      return { date, am: false, pm: false, reason: 'BLOCKED' };
    }
    const taken = bookingsByDate.get(date) || new Set();
    return {
      date,
      am: !taken.has('AM'),
      pm: !taken.has('PM'),
      ...(taken.size === 2 ? { reason: 'FULL' } : {}),
    };
  });
}

/* ───── calendar interop ───── */

/**
 * Slot start/end for a date, in Google Calendar's {dateTime, timeZone}
 * format. The dateTime is deliberately offset-free: we state the wall-clock
 * time and the zone, and Google handles DST. The drone flies at 8am Texas
 * time in January and in July; UTC can sort out what it calls that.
 */
export function slotToDateTimes(dateStr, slot) {
  const { start, end } = SLOT_TIMES[slot];
  return {
    start: { dateTime: `${dateStr}T${start}:00`, timeZone: TIME_ZONE },
    end: { dateTime: `${dateStr}T${end}:00`, timeZone: TIME_ZONE },
  };
}
