// AdminDashboard.jsx — the admin landing page. Four headline stats and a
// "next 7 days" docket, so Colin knows tonight whether to charge batteries.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetBookings, adminGetClients, adminGetPortfolioItems } from '../../services/api.js';
import { PageTitle, Card, ServiceTag, StatusTag, formatDateOnly } from './ui.jsx';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);

  // Three independent fetches, three independently tolerated failures.
  // A dashboard with partial data beats a dashboard holding short final
  // behind a spinner.
  useEffect(() => {
    adminGetBookings().then(setBookings).catch(() => {});
    adminGetClients().then(setClients).catch(() => {});
    adminGetPortfolioItems().then(setPortfolio).catch(() => {});
  }, []);

  // The 7-day window, computed in ISO date strings (YYYY-MM-DD), which compare
  // correctly with plain string operators — the one date format that behaves.
  // Cancelled bookings don't make the docket; that airspace is released.
  const today = new Date().toISOString().slice(0, 10);
  const weekOut = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => {
    const d = formatDateOnly(b.date);
    return d >= today && d <= weekOut && b.status !== 'CANCELLED';
  });

  // Headline numbers as [label, value] tuples; the Cards below do the styling.
  const stats = [
    ['TOTAL BOOKINGS', bookings.length],
    ['PENDING', bookings.filter((b) => b.status === 'PENDING').length],
    ['CLIENTS', clients.length],
    ['PORTFOLIO ITEMS', portfolio.length],
  ];

  return (
    <>
      <PageTitle>DASHBOARD</PageTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <div className="font-mono text-[10px] tracking-wide2 text-muted mb-2">{label}</div>
            <div className="font-display text-5xl text-gold">{value}</div>
          </Card>
        ))}
      </div>

      <Card title="NEXT 7 DAYS">
        {upcoming.length === 0 ? (
          <p className="text-muted text-sm">No bookings in the next 7 days.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((b) => (
              <li key={b.id} className="py-4 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-bone">{formatDateOnly(b.date)}</span>
                <span className="font-mono text-xs text-muted">{b.slot}</span>
                <ServiceTag service={b.service} />
                <span className="flex-1 text-sm">{b.clientName}</span>
                <StatusTag status={b.status} />
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/admin/bookings"
          className="inline-block mt-5 font-mono text-xs tracking-wide2 text-gold link-slide"
        >
          ALL BOOKINGS →
        </Link>
      </Card>
    </>
  );
}
