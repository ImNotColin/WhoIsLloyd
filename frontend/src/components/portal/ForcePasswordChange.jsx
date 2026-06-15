// ForcePasswordChange.jsx — the mandatory password change screen. Colin hands
// out temporary passwords when he creates accounts; this is the checkpoint
// that makes sure none of them survive past the first login.

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { apiError } from '../../services/api.js';
import Logo from '../ui/Logo.jsx';
import GoldButton from '../ui/GoldButton.jsx';

/**
 * Shown after first login (or an admin-forced reset) until the password
 * changes. There is no skip button. The only exits are a new password or
 * the sign-out link below — holding patterns have rules.
 */
export default function ForcePasswordChange() {
  const { changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    // Match check happens client-side; no reason to bother the server with
    // a typo we can catch from here.
    if (next !== confirm) {
      setError('New passwords do not match');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Success updates the stored user (mustResetPassword clears), and the
      // route guards re-render this screen out of existence.
      await changePassword(current, next);
    } catch (err) {
      setError(apiError(err, 'Password change failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-gold mb-8">
        <Logo size={56} />
      </div>
      <h1 className="heading-display text-4xl mb-2">SET A NEW PASSWORD</h1>
      <p className="font-mono text-xs tracking-wide2 text-muted mb-10 text-center max-w-sm">
        FOR YOUR SECURITY, CHOOSE A NEW PASSWORD BEFORE CONTINUING
      </p>

      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <div>
          <label className="label-dark" htmlFor="f-current">Temporary / Current Password</label>
          <input
            id="f-current"
            type="password"
            required
            autoComplete="current-password"
            className="input-dark"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div>
          <label className="label-dark" htmlFor="f-new">New Password (8+ characters)</label>
          <input
            id="f-new"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input-dark"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div>
          <label className="label-dark" htmlFor="f-confirm">Confirm New Password</label>
          <input
            id="f-confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input-dark"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="font-mono text-xs tracking-wide2 text-red-400">{error}</p>}
        <GoldButton type="submit" disabled={busy} className="w-full">
          {busy ? 'SAVING…' : 'SAVE & CONTINUE'}
        </GoldButton>
      </form>

      <button
        onClick={logout}
        className="mt-8 font-mono text-xs tracking-wide2 text-muted hover:text-gold transition-colors"
      >
        SIGN OUT
      </button>
    </main>
  );
}
