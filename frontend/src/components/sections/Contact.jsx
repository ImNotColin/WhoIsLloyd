import { useState } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation.js';
import GoldButton from '../ui/GoldButton.jsx';
import { sendContact, apiError } from '../../services/api.js';
import { BUSINESS } from '../../content.js';

const EMPTY = { name: '', email: '', phone: '', message: '' };

export default function Contact() {
  const ref = useScrollAnimation();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ state: 'idle' });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'sending' });
    try {
      const res = await sendContact(form);
      setStatus({ state: 'sent', message: res.message });
      setForm(EMPTY);
    } catch (err) {
      setStatus({ state: 'error', message: apiError(err, 'Could not send — call us instead.') });
    }
  };

  return (
    <section id="contact" ref={ref} className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14">
        <div>
          <p data-reveal className="section-kicker mb-4">07 / CONTACT</p>
          <h2 data-reveal className="heading-display text-5xl md:text-7xl mb-8">
            GET IN TOUCH
          </h2>
          <ul data-reveal className="space-y-5 font-mono text-sm tracking-wide2">
            <li>
              <a href={BUSINESS.phoneHref} className="link-slide text-bone hover:text-gold transition-colors">
                {BUSINESS.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${BUSINESS.email}`} className="link-slide text-bone hover:text-gold transition-colors">
                {BUSINESS.email}
              </a>
            </li>
            <li>
              <a
                href={BUSINESS.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 text-bone hover:text-gold transition-colors group"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                </svg>
                <span className="link-slide">{BUSINESS.instagram}</span>
              </a>
            </li>
          </ul>
        </div>

        <form data-reveal onSubmit={submit} className="space-y-5">
          <div>
            <label className="label-dark" htmlFor="c-name">Name</label>
            <input id="c-name" required minLength={2} className="input-dark" value={form.name} onChange={set('name')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label-dark" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" required className="input-dark" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label-dark" htmlFor="c-phone">Phone</label>
              <input id="c-phone" type="tel" required minLength={7} className="input-dark" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div>
            <label className="label-dark" htmlFor="c-message">Message</label>
            <textarea
              id="c-message"
              required
              minLength={10}
              rows={5}
              className="input-dark resize-y"
              value={form.message}
              onChange={set('message')}
            />
          </div>
          <GoldButton type="submit" disabled={status.state === 'sending'}>
            {status.state === 'sending' ? 'SENDING…' : 'SEND MESSAGE'}
          </GoldButton>
          {status.state === 'sent' && (
            <p className="font-mono text-xs tracking-wide2 text-gold">{status.message}</p>
          )}
          {status.state === 'error' && (
            <p className="font-mono text-xs tracking-wide2 text-red-400">{status.message}</p>
          )}
        </form>
      </div>
    </section>
  );
}
