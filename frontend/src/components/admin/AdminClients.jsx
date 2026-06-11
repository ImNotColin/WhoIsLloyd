// AdminClients.jsx — client account management: create accounts, issue
// temporary passwords, deliver files with a live progress readout, and
// (after a suitably stern confirm) delete everything. The busiest CRUD
// page in the hangar.

import { useEffect, useState } from 'react';
import {
  adminGetClients,
  adminCreateClient,
  adminUpdateClient,
  adminDeleteClient,
  adminUploadClientFiles,
  adminDeleteClientFile,
  apiError,
} from '../../services/api.js';
import { PageTitle, Card, Button, Feedback } from './ui.jsx';
import { formatBytes, formatDate } from '../portal/PortalDashboard.jsx';

const EMPTY = { name: '', email: '', temporaryPassword: '', projectLabel: '', notes: '' };

// 12 characters from an alphabet with no I/l/1/O/0 — no client should fail a
// login because of a font. crypto.getRandomValues, because Math.random is for
// dice games, not credentials.
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint32Array(12)))
    .map((n) => chars[n % chars.length])
    .join('');
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [expanded, setExpanded] = useState(null);
  const [uploading, setUploading] = useState(null); // { id, percent } — whose upload is airborne, and how far along
  const [feedback, setFeedback] = useState(null);

  const load = () => adminGetClients().then(setClients).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    try {
      await adminCreateClient(form);
      setFeedback({
        ok: true,
        message: `Client created. Send them their temporary password: ${form.temporaryPassword}`,
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  // Deleting a client takes their delivered files down with them, so the
  // confirm dialog spells that out in full. No fine print.
  const remove = async (client) => {
    if (
      !window.confirm(
        `Delete ${client.name}'s account AND all their delivered files? This cannot be undone.`
      )
    )
      return;
    try {
      await adminDeleteClient(client.id);
      setExpanded(null);
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  // Password reset: generate first, confirm second — the admin sees the new
  // password before committing, because it has to be relayed to the client.
  const resetPassword = async (client) => {
    const pw = generatePassword();
    if (!window.confirm(`Reset ${client.name}'s password to: ${pw} ?`)) return;
    try {
      await adminUpdateClient(client.id, { newPassword: pw, forcePasswordReset: true });
      setFeedback({ ok: true, message: `New temporary password for ${client.name}: ${pw}` });
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  // File delivery with a live percentage. Drone footage is measured in
  // gigabytes; a button that just says "Uploading…" for four minutes is
  // indistinguishable from a crash.
  const upload = async (client, files) => {
    if (!files.length) return;
    setUploading({ id: client.id, percent: 0 });
    try {
      await adminUploadClientFiles(client.id, files, (e) => {
        if (e.total) setUploading({ id: client.id, percent: Math.round((e.loaded / e.total) * 100) });
      });
      setFeedback({ ok: true, message: `${files.length} file(s) delivered to ${client.name}` });
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    } finally {
      setUploading(null);
    }
  };

  const removeFile = async (clientId, file) => {
    if (!window.confirm(`Remove ${file.filename}?`)) return;
    try {
      await adminDeleteClientFile(clientId, file.id);
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  return (
    <>
      <PageTitle>CLIENTS</PageTitle>

      <Card title="CREATE CLIENT ACCOUNT" className="mb-6">
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-dark">Full Name</label>
            <input required className="input-dark" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label-dark">Email</label>
            <input required type="email" className="input-dark" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label-dark">Temporary Password</label>
            <div className="flex gap-2">
              <input
                required
                minLength={8}
                className="input-dark font-mono"
                value={form.temporaryPassword}
                onChange={set('temporaryPassword')}
              />
              <Button type="button" onClick={() => setForm({ ...form, temporaryPassword: generatePassword() })}>
                Generate
              </Button>
            </div>
          </div>
          <div>
            <label className="label-dark">Project Label (shown to client)</label>
            <input
              className="input-dark"
              placeholder='e.g. "Smith Wedding — June 2026"'
              value={form.projectLabel}
              onChange={set('projectLabel')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-dark">Project Notes (shown to client in their portal)</label>
            <textarea rows={2} className="input-dark" value={form.notes} onChange={set('notes')} />
          </div>
          <div>
            <Button type="submit">Create Client</Button>
          </div>
        </form>
      </Card>

      <Card title={`ALL CLIENTS (${clients.length})`}>
        {clients.length === 0 ? (
          <p className="text-muted text-sm">No client accounts yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {clients.map((c) => (
              <li key={c.id} className="py-4">
                <button
                  className="w-full flex flex-wrap items-center gap-3 text-left"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  aria-expanded={expanded === c.id}
                >
                  <span className="flex-1">
                    <span className="text-bone">{c.name}</span>
                    <span className="font-mono text-xs text-muted ml-3">{c.email}</span>
                  </span>
                  {c.projectLabel && (
                    <span className="font-mono text-[10px] tracking-wide2 text-gold">{c.projectLabel}</span>
                  )}
                  <span className="font-mono text-[10px] text-muted">{c.files?.length || 0} FILES</span>
                  {c.mustResetPassword && (
                    <span className="font-mono text-[10px] tracking-wide2 text-yellow-400 border border-yellow-900 px-2 py-0.5">
                      PW RESET PENDING
                    </span>
                  )}
                </button>

                {expanded === c.id && (
                  <div className="mt-4 ml-2 pl-4 border-l border-gold/30 space-y-4">
                    <EditClient client={c} onSaved={load} setFeedback={setFeedback} />

                    <div>
                      <div className="label-dark">Delivered Files</div>
                      {c.files?.length ? (
                        <ul className="divide-y divide-line border border-line mb-3">
                          {c.files.map((f) => (
                            <li key={f.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                              <span className="flex-1 break-all">{f.filename}</span>
                              <span className="font-mono text-[10px] text-muted">
                                {formatBytes(f.fileSize)} · {formatDate(f.uploadedAt)}
                              </span>
                              <Button danger onClick={() => removeFile(c.id, f)}>
                                ✕
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted text-sm mb-3">No files delivered yet.</p>
                      )}
                      <label className="inline-block">
                        <span className="font-mono text-xs tracking-wide2 uppercase px-4 py-2 border border-gold/50 text-gold hover:bg-gold hover:text-ink transition-all cursor-pointer">
                          {uploading?.id === c.id ? `UPLOADING ${uploading.percent}%` : 'UPLOAD FILES'}
                        </span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          disabled={Boolean(uploading)}
                          onChange={(e) => upload(c, Array.from(e.target.files))}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button onClick={() => resetPassword(c)}>Reset Password</Button>
                      <Button danger onClick={() => remove(c)}>
                        Delete Client
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

// Inline edit form for an expanded client row. Drafts locally; nothing
// reaches the server until Save Changes.
function EditClient({ client, onSaved, setFeedback }) {
  const [form, setForm] = useState({
    name: client.name,
    email: client.email,
    projectLabel: client.projectLabel || '',
    notes: client.notes || '',
  });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      await adminUpdateClient(client.id, form);
      setFeedback({ ok: true, message: `${form.name} updated` });
      onSaved();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  return (
    <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
      <input className="input-dark" value={form.name} onChange={set('name')} placeholder="Name" />
      <input className="input-dark" type="email" value={form.email} onChange={set('email')} placeholder="Email" />
      <input
        className="input-dark"
        value={form.projectLabel}
        onChange={set('projectLabel')}
        placeholder="Project label"
      />
      <textarea
        className="input-dark sm:col-span-2"
        rows={2}
        value={form.notes}
        onChange={set('notes')}
        placeholder="Project notes (visible to client)"
      />
      <div>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
