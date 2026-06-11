// App.jsx — the route table. Decides who lands where, and who gets turned
// around at the gate. Public site up front, portal and admin behind auth.

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.jsx';

import HomePage from './pages/HomePage.jsx';
import ForcePasswordChange from './components/portal/ForcePasswordChange.jsx';

// ---- Lazy chunks ------------------------------------------------------------
// Everything beyond the public one-pager is code-split. A visitor who came to
// watch drone footage should not be charged for the admin dashboard's baggage.
const BookingPage = lazy(() => import('./components/booking/BookingPage.jsx'));
const PortalLogin = lazy(() => import('./components/portal/PortalLogin.jsx'));
const PortalDashboard = lazy(() => import('./components/portal/PortalDashboard.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard.jsx'));
const AdminBookings = lazy(() => import('./components/admin/AdminBookings.jsx'));
const AdminAvailability = lazy(() => import('./components/admin/AdminAvailability.jsx'));
const AdminClients = lazy(() => import('./components/admin/AdminClients.jsx'));
const AdminPortfolio = lazy(() => import('./components/admin/AdminPortfolio.jsx'));
const AdminTestimonials = lazy(() => import('./components/admin/AdminTestimonials.jsx'));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings.jsx'));

// ---- Guards -----------------------------------------------------------------

// The no-fly zone enforcement. No token: back to /portal. Not an admin trying
// to be one: same. Stale temporary password: grounded until it's changed.
function RequireAuth({ children, admin = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/portal" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/portal" replace />;
  if (user.mustResetPassword) return <ForcePasswordChange />;
  return children;
}

// SPAs preserve scroll position across navigations, which nobody has ever
// wanted. Reset to the top on every route change — unless a #hash is steering,
// in which case HomePage handles the descent.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ---- Routes -----------------------------------------------------------------

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center font-mono text-xs tracking-wide2 text-muted">
            LOADING…
          </div>
        }
      >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        <Route path="/portal" element={<PortalRoot />} />

        <Route
          path="/admin"
          element={
            <RequireAuth admin>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="availability" element={<AdminAvailability />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="portfolio" element={<AdminPortfolio />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Lost? The homepage is this way. No 404 page; nothing here is worth memorializing. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}

// /portal is a switchboard, not a page: anonymous users get the login form,
// fresh accounts get the mandatory password change, admins get rerouted to
// /admin, and actual clients finally get their footage.
function PortalRoot() {
  const { user } = useAuth();
  if (!user) return <PortalLogin />;
  if (user.mustResetPassword) return <ForcePasswordChange />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <PortalDashboard />;
}
