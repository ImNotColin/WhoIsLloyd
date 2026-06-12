// AdminTestimonials.jsx — testimonial intake and moderation. Add quotes,
// toggle visibility, delete. Every kind word requires Colin's stamp before
// it's cleared for the homepage.

import { useEffect, useState } from 'react';
import {
  adminGetTestimonials,
  adminCreateTestimonial,
  adminUpdateTestimonial,
  adminDeleteTestimonial,
  apiError,
} from '../../services/api.js';
import { PageTitle, Card, Button, ServiceTag, Feedback } from './ui.jsx';

const SERVICES = ['REAL_ESTATE', 'EVENTS', 'CONSTRUCTION', 'WEDDINGS'];
const EMPTY = { clientName: '', service: 'REAL_ESTATE', quote: '', rating: 5, visible: true };

export default function AdminTestimonials() {
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [feedback, setFeedback] = useState(null);

  const refreshTestimonials = () => adminGetTestimonials().then(setQuotes).catch(() => {});
  useEffect(() => {
    refreshTestimonials();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    try {
      // rating arrives from the input as a string; the API prefers its stars numeric.
      await adminCreateTestimonial({ ...form, rating: Number(form.rating) });
      setFeedback({ ok: true, message: 'Testimonial added' });
      setForm(EMPTY);
      refreshTestimonials();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  // The approval mechanism, reduced to one boolean. Hidden testimonials
  // still exist; they are simply grounded.
  const toggle = async (item) => {
    try {
      await adminUpdateTestimonial(item.id, { visible: !item.visible });
      refreshTestimonials();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.clientName}'s testimonial?`)) return;
    try {
      await adminDeleteTestimonial(item.id);
      refreshTestimonials();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  return (
    <>
      <PageTitle>TESTIMONIALS</PageTitle>

      <Card title="ADD TESTIMONIAL" className="mb-6">
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-dark">Client Name</label>
            <input required className="input-dark" value={form.clientName} onChange={set('clientName')} />
          </div>
          <div>
            <label className="label-dark">Service</label>
            <select className="input-dark" value={form.service} onChange={set('service')}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label-dark">Quote</label>
            <textarea required minLength={10} rows={3} className="input-dark" value={form.quote} onChange={set('quote')} />
          </div>
          <div>
            <label className="label-dark">Star Rating (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="input-dark"
              value={form.rating}
              onChange={set('rating')}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Add</Button>
          </div>
        </form>
        <Feedback value={feedback} />
      </Card>

      <Card title={`ALL TESTIMONIALS (${quotes.length})`}>
        {quotes.length === 0 ? (
          <p className="text-muted text-sm">
            None yet — the public section stays hidden until the first visible testimonial.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {quotes.map((item) => (
              <li key={item.id} className="py-4 flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-bone">{item.clientName}</span>
                    <ServiceTag service={item.service} />
                    <span className="text-gold font-mono text-xs">{'★'.repeat(item.rating)}</span>
                  </div>
                  <p className="text-muted text-sm">&ldquo;{item.quote}&rdquo;</p>
                </div>
                <Button onClick={() => toggle(item)}>{item.visible ? 'Hide' : 'Show'}</Button>
                <Button danger onClick={() => remove(item)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
