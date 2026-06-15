// BookingForm.jsx — wizard step 4: contact details and shoot notes.
// Service/slot/date arrive as props already chosen; this form only collects
// who you are and what we're flying over. Validation is plain HTML
// constraints — the browser nags for free, and the server re-checks
// everything anyway because browsers can be talked out of things.

import { useState } from 'react';
import GoldButton from '../ui/GoldButton.jsx';
import { SERVICE_LABELS } from '../../content.js';

const SLOT_LABELS = { AM: 'Morning (8am–12pm)', PM: 'Afternoon (1pm–5pm)' };

export default function BookingForm({ service, slot, date, onSubmit, submitting, error }) {
  const [form, setForm] = useState({ clientName: '', email: '', phone: '', notes: '' });
  // One curried onChange to rule all four fields.
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-6"
    >
      {/* Read-only recap of steps 1–3, so nobody confirms a wedding shoot
          they meant to book as real estate. */}
      <div className="grid sm:grid-cols-3 gap-4 font-mono text-xs tracking-wide2">
        {[
          ['SERVICE', SERVICE_LABELS[service]],
          ['DATE', date],
          ['SLOT', SLOT_LABELS[slot]],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface border border-gold/30 px-4 py-3">
            <div className="text-muted mb-1">{label}</div>
            <div className="text-gold">{value}</div>
          </div>
        ))}
      </div>

      <div>
        <label className="label-dark" htmlFor="b-name">Full Name *</label>
        <input id="b-name" required minLength={2} className="input-dark" value={form.clientName} onChange={set('clientName')} />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label-dark" htmlFor="b-email">Email *</label>
          <input id="b-email" type="email" required className="input-dark" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label-dark" htmlFor="b-phone">Phone *</label>
          <input id="b-phone" type="tel" required minLength={7} className="input-dark" value={form.phone} onChange={set('phone')} />
        </div>
      </div>
      <div>
        <label className="label-dark" htmlFor="b-notes">
          Notes / Shoot Specifics * <span className="text-line">(minimum 20 characters)</span>
        </label>
        <textarea
          id="b-notes"
          required
          minLength={20}
          rows={5}
          className="input-dark resize-y"
          placeholder="Describe your shoot — location, style, what you need captured, any special requirements"
          value={form.notes}
          onChange={set('notes')}
        />
      </div>

      {error && (
        <p className="font-mono text-xs tracking-wide2 text-red-400">{error}</p>
      )}

      {/* Disabled while in flight — the double-clickers shall not double-book. */}
      <GoldButton solid type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'BOOKING…' : 'CONFIRM BOOKING'}
      </GoldButton>
    </form>
  );
}
