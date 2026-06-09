// All booking dates are handled as plain "YYYY-MM-DD" strings and stored as
// UTC-midnight DateTimes. Slot wall-clock times are fixed in Central Time.

export const SLOT_TIMES = {
  AM: { start: '08:00', end: '12:00', label: 'Morning (8am–12pm)' },
  PM: { start: '13:00', end: '17:00', label: 'Afternoon (1pm–5pm)' },
};

export const MIN_ADVANCE_DAYS = 7;
export const TIME_ZONE = 'America/Chicago';

const DAY_FLAGS = [
  'sundayOn',
  'mondayOn',
  'tuesdayOn',
  'wednesdayOn',
  'thursdayOn',
  'fridayOn',
  'saturdayOn',
];

/** Today's date in Central Time as "YYYY-MM-DD". */
export function todayCT() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isValidDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

/** "YYYY-MM-DD" -> Date at UTC midnight (canonical DB representation). */
export function toUTCDate(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function dateToString(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const d = toUTCDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return dateToString(d);
}

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
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) =>
    `${monthStr}-${String(i + 1).padStart(2, '0')}`
  );
}

/**
 * Builds the availability picture for one month.
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

/** Slot start/end as UTC Date objects for a CT wall-clock date+slot. */
export function slotToDateTimes(dateStr, slot) {
  const { start, end } = SLOT_TIMES[slot];
  return {
    start: { dateTime: `${dateStr}T${start}:00`, timeZone: TIME_ZONE },
    end: { dateTime: `${dateStr}T${end}:00`, timeZone: TIME_ZONE },
  };
}
