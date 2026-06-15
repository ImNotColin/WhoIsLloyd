// DatePicker.jsx — wizard step 3: the availability calendar. A hand-rolled
// month grid, because every calendar library we auditioned weighed more than
// the drone.

import { useEffect, useMemo, useState } from 'react';
import { getMonthAvailability } from '../../services/api.js';
import { BUSINESS } from '../../content.js';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// ---- Month math -------------------------------------------------------------
// Months travel as "YYYY-MM" strings throughout. String comparison sorts them
// correctly, which spares us a great deal of Date arithmetic and the bugs
// that come bundled with it.

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// "2026-06" -> "June 2026", for the header.
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Month calendar fed by /api/bookings/availability.
 * `slot` ("AM"|"PM") determines which half-day's availability gates a date —
 * the server reports both halves and we judge only the one being booked.
 */
export default function DatePicker({ slot, value, onSelect }) {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMonthAvailability(month)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [month]);

  const currentMonth = monthKey(new Date());

  // Paging is clamped at the current month. The past is fully booked.
  const shiftMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const target = new Date(y, m - 1 + delta, 1);
    const next = monthKey(target);
    if (next < currentMonth) return;
    setMonth(next);
  };

  // Pad the grid with leading blanks so day 1 lands in its weekday column.
  // UTC on purpose: the server's day list is timezone-agnostic, and we are not
  // going to let local midnight shift the calendar by a day for night owls.
  const cells = useMemo(() => {
    if (!data) return [];
    const [y, m] = month.split('-').map(Number);
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return [...Array(firstDow).fill(null), ...data.days];
  }, [data, month]);

  // Classify a day for the requested slot. Closed days get a title attribute
  // explaining why — a disabled square with no explanation just reads as a
  // grudge.
  const dayState = (day) => {
    if (!day) return null;
    const open = slot === 'AM' ? day.am : day.pm;
    if (open) return { open: true };
    const titles = {
      TOO_SOON: `Call ${BUSINESS.phone} for short-notice bookings`,
      DAY_OFF: 'Not available this day of the week',
      BLOCKED: 'Unavailable',
      FULL: 'Fully booked',
    };
    // No named reason but the other half-day is free? Say so — it converts
    // a dead end into a different booking.
    const otherOpen = slot === 'AM' ? day.pm : day.am;
    return {
      open: false,
      title:
        titles[day.reason] ||
        (otherOpen
          ? `${slot === 'AM' ? 'Morning' : 'Afternoon'} is taken — the ${
              slot === 'AM' ? 'afternoon' : 'morning'
            } slot is still open`
          : 'Unavailable'),
    };
  };

  return (
    <div className="bg-surface border border-line p-5 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={month <= currentMonth}
          className="text-gold disabled:text-line text-2xl px-3 font-display"
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="heading-display text-2xl">{monthLabel(month)}</div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="text-gold text-2xl px-3 font-display"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center font-mono text-[10px] tracking-wide2 text-muted py-2">
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center font-mono text-xs tracking-wide2 text-muted">
          LOADING AVAILABILITY…
        </div>
      ) : !data ? (
        <div className="py-16 text-center font-mono text-xs tracking-wide2 text-red-400">
          COULD NOT LOAD AVAILABILITY — CALL {BUSINESS.phone}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`blank-${i}`} />;
            const state = dayState(day);
            const selected = value === day.date;
            const num = Number(day.date.slice(8, 10));
            return (
              <button
                key={day.date}
                type="button"
                disabled={!state.open}
                title={state.open ? undefined : state.title}
                onClick={() => onSelect(day.date)}
                className={`aspect-square flex items-center justify-center text-sm transition-all ${
                  selected
                    ? 'bg-gold text-ink font-semibold'
                    : state.open
                      ? 'text-bone hover:bg-gold/20 border border-line'
                      : 'text-line cursor-not-allowed'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-5 font-mono text-[10px] tracking-wide2 text-muted">
        BOOKINGS REQUIRE 7 DAYS NOTICE · SOONER? CALL {BUSINESS.phone}
      </p>
    </div>
  );
}
