// AdminAvailability.jsx — the weekly day-of-week toggles plus one-off blocked
// dates. This page is the final authority on whether the calendar says yes.

import { useEffect, useState } from 'react';
import {
  adminGetAvailability,
  adminUpdateDays,
  adminBlockDate,
  adminUnblockDate,
  apiError,
} from '../../services/api.js';
import { PageTitle, Card, Button, Feedback } from './ui.jsx';

// [settings key, human label] pairs — the field names the API expects, in the
// order humans expect.
const DAYS = [
  ['mondayOn', 'Monday'],
  ['tuesdayOn', 'Tuesday'],
  ['wednesdayOn', 'Wednesday'],
  ['thursdayOn', 'Thursday'],
  ['fridayOn', 'Friday'],
  ['saturdayOn', 'Saturday'],
  ['sundayOn', 'Sunday'],
];

export default function AdminAvailability() {
  const [settings, setSettings] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [feedback, setFeedback] = useState(null);

  const load = () =>
    adminGetAvailability()
      .then((data) => {
        setSettings(data.settings);
        setBlocked(data.blockedDates);
      })
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  // Optimistic toggle: flip the checkbox immediately, then persist. If the
  // save fails we reload from the server — the UI returns to reality with no
  // lie left on screen.
  const toggleDay = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      const { id, ...days } = next; // the API wants days only, not the row id
      await adminUpdateDays(days);
      setFeedback({ ok: true, message: 'Availability saved' });
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
      load();
    }
  };

  // Ground a single date: weddings, maintenance days, weather you can see coming.
  const block = async (e) => {
    e.preventDefault();
    if (!newDate) return;
    try {
      await adminBlockDate(newDate);
      setNewDate('');
      setFeedback({ ok: true, message: `${newDate} blocked` });
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  const unblock = async (id) => {
    try {
      await adminUnblockDate(id);
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  return (
    <>
      <PageTitle>AVAILABILITY</PageTitle>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="AVAILABLE DAYS OF WEEK">
          {!settings ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : (
            <ul className="space-y-3">
              {DAYS.map(([key, label]) => (
                <li key={key}>
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={() => toggleDay(key)}
                      className="w-4 h-4 accent-[#C9A84C]"
                    />
                    <span
                      className={`font-mono text-sm tracking-wide2 ${
                        settings[key] ? 'text-bone' : 'text-muted'
                      } group-hover:text-gold transition-colors`}
                    >
                      {label.toUpperCase()}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 font-mono text-[10px] tracking-wide2 text-muted">
            SLOTS ARE FIXED: AM 8–12 · PM 1–5 (CENTRAL)
          </p>
        </Card>

        <Card title="BLOCKED DATES">
          <form onSubmit={block} className="flex gap-3 mb-6">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="input-dark flex-1"
              style={{ colorScheme: 'dark' }}
            />
            <Button type="submit">Block</Button>
          </form>
          {blocked.length === 0 ? (
            <p className="text-muted text-sm">No blocked dates.</p>
          ) : (
            <ul className="divide-y divide-line">
              {blocked.map((b) => (
                <li key={b.id} className="py-3 flex items-center justify-between">
                  <span className="font-mono text-sm">{b.date}</span>
                  <Button danger onClick={() => unblock(b.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Feedback value={feedback} />
    </>
  );
}
