// AdminLayout.jsx — the admin shell: sidebar nav (which folds into a top bar
// on mobile), a logout button, and an <Outlet /> where the actual work lands.

import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import Logo from '../ui/Logo.jsx';

// One entry per admin page. The order here is the order on screen.
const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/availability', label: 'Availability' },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/portfolio', label: 'Portfolio' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/bloopers', label: 'Bloopers' },
  { to: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-line bg-surface/60">
        <div className="p-5 flex items-center gap-3 border-b border-line">
          <Link to="/" className="text-gold" aria-label="View site">
            <Logo size={36} />
          </Link>
          <div>
            <div className="font-display tracking-cinematic text-lg leading-none">ADMIN</div>
            <div className="font-mono text-[10px] tracking-wide2 text-muted">DRONES BY COLIN</div>
          </div>
        </div>
        <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-4 py-2.5 font-mono text-xs tracking-wide2 uppercase whitespace-nowrap rounded transition-colors ${
                  isActive ? 'bg-gold/15 text-gold' : 'text-muted hover:text-bone'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {/* Logout sits apart from the nav links and goes red on hover —
              a small preflight warning before you actually commit to it. */}
          <button
            onClick={logout}
            className="px-4 py-2.5 font-mono text-xs tracking-wide2 uppercase text-left text-muted
              hover:text-red-400 transition-colors md:mt-6 whitespace-nowrap"
          >
            Log out
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-5 md:p-10 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
