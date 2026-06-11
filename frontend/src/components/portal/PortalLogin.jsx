// PortalLogin.jsx — the client portal's front door. No self-signup, no
// "forgot password" flow: Colin creates every account by hand, and resets
// happen over the phone. At this scale, the human is the identity provider.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { apiError } from '../../services/api.js';
import Logo from '../ui/Logo.jsx';
import GoldButton from '../ui/GoldButton.jsx';

export default function PortalLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      // No navigate() here on purpose: setting the user makes PortalRoot
      // re-render into the dashboard, the forced password change, or the
      // admin redirect. State is the router.
    } catch (err) {
      setError(apiError(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <Link to="/" className="text-gold mb-8" aria-label="Back to site">
        <Logo size={64} />
      </Link>
      <h1 className="heading-display text-4xl md:text-5xl mb-2">CLIENT PORTAL</h1>
      <p className="font-mono text-xs tracking-wide2 text-muted mb-10">
        YOUR FOOTAGE LIVES HERE
      </p>

      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <div>
          <label className="label-dark" htmlFor="p-email">Email</label>
          <input
            id="p-email"
            type="email"
            required
            autoComplete="email"
            className="input-dark"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label-dark" htmlFor="p-pass">Password</label>
          <input
            id="p-pass"
            type="password"
            required
            autoComplete="current-password"
            className="input-dark"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="font-mono text-xs tracking-wide2 text-red-400">{error}</p>}
        <GoldButton type="submit" disabled={busy} className="w-full">
          {busy ? 'SIGNING IN…' : 'SIGN IN'}
        </GoldButton>
      </form>

      <p className="mt-8 text-muted text-xs">
        Lost your password? Call us — we&rsquo;ll reset it.
      </p>
      <Link to="/" className="mt-4 font-mono text-xs tracking-wide2 text-gold link-slide">
        ← BACK TO SITE
      </Link>
    </main>
  );
}
