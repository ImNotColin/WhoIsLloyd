import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.jsx';

import HomePage from './pages/HomePage.jsx';
import ForcePasswordChange from './components/portal/ForcePasswordChange.jsx';

// Everything beyond the public one-pager is code-split — visitors never load it.
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

function RequireAuth({ children, admin = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/portal" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/portal" replace />;
  if (user.mustResetPassword) return <ForcePasswordChange />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}

function PortalRoot() {
  const { user } = useAuth();
  if (!user) return <PortalLogin />;
  if (user.mustResetPassword) return <ForcePasswordChange />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <PortalDashboard />;
}
