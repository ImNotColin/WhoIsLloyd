import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetBookings, adminGetClients, adminGetPortfolioItems } from '../../services/api.js';
import { PageTitle, Card, ServiceTag, StatusTag, formatDateOnly } from './ui.jsx';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    adminGetBookings().then(setBookings).catch(() => {});
    adminGetClients().then(setClients).catch(() => {});
    adminGetPortfolioItems().then(setPortfolio).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const weekOut = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => {
    const d = formatDateOnly(b.date);
    return d >= today && d <= weekOut && b.status !== 'CANCELLED';
  });

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
