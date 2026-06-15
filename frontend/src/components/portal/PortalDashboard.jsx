// PortalDashboard.jsx — where clients land after login: their files, their
// download buttons, and any notes Colin left with the delivery. The footage
// took weeks to shoot and edit; this page's only job is to hand it over
// without ceremony.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getPortalMe, downloadPortalFile } from '../../services/api.js';
import Logo from '../ui/Logo.jsx';

// ---- Formatters (exported — the admin file lists borrow these) --------------

// 1234567 -> "1.2 MB". Whole bytes get no decimal; nobody needs "512.0 B".
export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ISO timestamp -> "Jun 11, 2026".
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---- Dashboard --------------------------------------------------------------

export default function PortalDashboard() {
  const { user, logout } = useAuth();
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getPortalMe()
      .then(setMe)
      .catch(() => setError('Could not load your projects. Try refreshing.'));
  }, []);

  // Track which file is mid-download so its button can say so. Wedding films
  // are not small; without feedback people click again and download two.
  const download = async (file) => {
    setDownloading(file.id);
    try {
      await downloadPortalFile(file.id, file.filename);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-12">
      <header className="flex items-center justify-between mb-12">
        <Link to="/" className="text-gold" aria-label="Back to site">
          <Logo size={44} />
        </Link>
        <button
          onClick={logout}
          className="font-mono text-xs tracking-wide2 text-muted hover:text-gold transition-colors"
        >
          LOG OUT
        </button>
      </header>

      {/* Greet from the cached auth user until /portal/me lands — better a
          name from localStorage than "WELCOME, " followed by nothing. */}
      <h1 className="heading-display text-4xl md:text-6xl mb-2">
        WELCOME, {(me?.name || user?.name || '').toUpperCase()}
      </h1>
      {me?.projectLabel && (
        <p className="font-mono text-sm tracking-wide2 text-gold mb-10">
          {me.projectLabel.toUpperCase()}
        </p>
      )}

      {error && <p className="text-red-400 font-mono text-xs tracking-wide2">{error}</p>}

      {me && (
        <>
          <section className="mt-10">
            <h2 className="section-kicker mb-5">YOUR FILES</h2>
            {me.files.length === 0 ? (
              <p className="text-muted text-sm border border-line bg-surface p-6">
                Nothing here yet — your footage will appear as soon as it&rsquo;s ready.
              </p>
            ) : (
              <ul className="divide-y divide-line border border-line bg-surface">
                {me.files.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-4 p-5">
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-bone break-all">{f.filename}</div>
                      <div className="font-mono text-[11px] tracking-wide2 text-muted mt-1">
                        {formatBytes(f.fileSize)} · UPLOADED {formatDate(f.uploadedAt).toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => download(f)}
                      disabled={downloading === f.id}
                      className="font-mono text-xs tracking-wide2 text-gold border border-gold/50
                        px-5 py-2 hover:bg-gold hover:text-ink transition-all disabled:opacity-40"
                    >
                      {downloading === f.id ? 'DOWNLOADING…' : 'DOWNLOAD'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {me.notes && (
            <section className="mt-10">
              <h2 className="section-kicker mb-5">NOTES FROM COLIN</h2>
              <p className="text-bone/80 leading-relaxed border border-line bg-surface p-6 whitespace-pre-wrap">
                {me.notes}
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
