import { useEffect, useState } from 'react';
import { adminGetBookings, adminUpdateBooking, adminDeleteBooking, apiError } from '../../services/api.js';
import { PageTitle, Card, Button, ServiceTag, StatusTag, Feedback, formatDateOnly } from './ui.jsx';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [expanded, setExpanded] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = () => adminGetBookings().then(setBookings).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const sorted = [...bookings].sort((a, b) =>
    sortBy === 'date'
      ? String(a.date).localeCompare(String(b.date))
      : a.status.localeCompare(b.status) || String(a.date).localeCompare(String(b.date))
  );

  const setStatus = async (id, status) => {
    try {
      await adminUpdateBooking(id, status);
      setFeedback({ ok: true, message: `Booking #${id} → ${status}` });
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete booking #${id}? This cannot be undone.`)) return;
    try {
      await adminDeleteBooking(id);
      setFeedback({ ok: true, message: `Booking #${id} deleted` });
      setExpanded(null);
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  return (
    <>
      <PageTitle>BOOKINGS</PageTitle>
      <Card>
        <div className="flex items-center gap-4 mb-5 font-mono text-xs tracking-wide2">
          <span className="text-muted">SORT BY</span>
          {['date', 'status'].map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`uppercase ${sortBy === key ? 'text-gold' : 'text-muted hover:text-bone'}`}
            >
              {key}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <p className="text-muted text-sm">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {sorted.map((b) => (
              <li key={b.id} className="py-4">
                <button
                  className="w-full flex flex-wrap items-center gap-3 text-left"
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  aria-expanded={expanded === b.id}
                >
                  <span className="font-mono text-xs text-muted">#{b.id}</span>
                  <span className="font-mono text-sm">{formatDateOnly(b.date)}</span>
                  <span className="font-mono text-xs text-muted">{b.slot}</span>
                  <ServiceTag service={b.service} />
                  <span className="flex-1 text-sm">{b.clientName}</span>
                  <StatusTag status={b.status} />
                </button>

                {expanded === b.id && (
                  <div className="mt-4 ml-2 pl-4 border-l border-gold/30 space-y-3 text-sm">
                    <div className="grid sm:grid-cols-2 gap-2 font-mono text-xs">
                      <div><span className="text-muted">EMAIL </span>{b.email}</div>
                      <div><span className="text-muted">PHONE </span>{b.phone}</div>
                      <div><span className="text-muted">CREATED </span>{formatDateOnly(b.createdAt)}</div>
                      <div><span className="text-muted">GCAL </span>{b.gcalEventId ? 'linked' : '—'}</div>
                    </div>
                    <p className="text-bone/80 whitespace-pre-wrap">{b.notes}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {STATUSES.filter((s) => s !== b.status).map((s) => (
                        <Button key={s} onClick={() => setStatus(b.id, s)}>
                          {s}
                        </Button>
                      ))}
                      <Button danger onClick={() => remove(b.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <Feedback value={feedback} />
      </Card>
    </>
  );
}
