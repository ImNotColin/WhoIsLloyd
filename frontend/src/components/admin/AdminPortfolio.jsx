// AdminPortfolio.jsx — the portfolio back office. Thumbnail + video go up as
// multipart FormData with a progress readout; ordering is a number field that
// commits on blur. What the public sees as "THE WORK" gets loaded here first.

import { useEffect, useState } from 'react';
import {
  adminGetPortfolioItems,
  adminCreatePortfolio,
  adminUpdatePortfolio,
  adminDeletePortfolio,
  apiError,
} from '../../services/api.js';
import { PageTitle, Card, Button, ServiceTag, Feedback } from './ui.jsx';

const SERVICES = ['REAL_ESTATE', 'EVENTS', 'CONSTRUCTION', 'WEDDINGS'];
const EMPTY = { title: '', category: 'REAL_ESTATE', displayOrder: 0 };

export default function AdminPortfolio() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [thumbnail, setThumbnail] = useState(null);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = () => adminGetPortfolioItems().then(setItems).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  // Publish a new item. Both files are required before takeoff — a portfolio
  // entry without a video is just a thumbnail with ambitions.
  const create = async (e) => {
    e.preventDefault();
    if (!thumbnail || !video) {
      setFeedback({ ok: false, message: 'Pick both a thumbnail image and a video file' });
      return;
    }
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('category', form.category);
    fd.append('displayOrder', String(form.displayOrder));
    fd.append('thumbnail', thumbnail);
    fd.append('video', video);

    // Track upload progress as a whole-number percent; the Publish button
    // doubles as the progress bar. On success, reset everything — state,
    // file pickers (via form.reset), and the list itself.
    setUploading(0);
    try {
      await adminCreatePortfolio(fd, (e2) => {
        if (e2.total) setUploading(Math.round((e2.loaded / e2.total) * 100));
      });
      setFeedback({ ok: true, message: 'Portfolio item published' });
      setForm(EMPTY);
      setThumbnail(null);
      setVideo(null);
      e.target.reset();
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    } finally {
      setUploading(null);
    }
  };

  // Reordering commits on blur, and only when the number actually changed —
  // no sense radioing the API about a tab-through.
  const reorder = async (item, displayOrder) => {
    try {
      await adminUpdatePortfolio(item.id, { displayOrder: Number(displayOrder) });
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await adminDeletePortfolio(item.id);
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  return (
    <>
      <PageTitle>PORTFOLIO</PageTitle>

      <Card title="UPLOAD NEW ITEM" className="mb-6">
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-dark">Title</label>
            <input
              required
              className="input-dark"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label-dark">Category</label>
            <select
              className="input-dark"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-dark">Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
              className="input-dark"
              onChange={(e) => setThumbnail(e.target.files[0] || null)}
            />
          </div>
          <div>
            <label className="label-dark">Video File</label>
            <input
              type="file"
              accept="video/*"
              className="input-dark"
              onChange={(e) => setVideo(e.target.files[0] || null)}
            />
          </div>
          <div>
            <label className="label-dark">Display Order</label>
            <input
              type="number"
              className="input-dark"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={uploading !== null}>
              {uploading !== null ? `Uploading ${uploading}%` : 'Publish'}
            </Button>
          </div>
        </form>
        <Feedback value={feedback} />
      </Card>

      <Card title={`ALL ITEMS (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-muted text-sm">Nothing in the portfolio yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="py-4 flex flex-wrap items-center gap-4">
                <img
                  src={item.thumbnailPath}
                  alt=""
                  className="w-24 aspect-video object-cover border border-line"
                />
                <div className="flex-1 min-w-[160px]">
                  <div className="text-bone">{item.title}</div>
                  <div className="mt-1">
                    <ServiceTag service={item.category} />
                  </div>
                </div>
                <label className="font-mono text-[10px] tracking-wide2 text-muted flex items-center gap-2">
                  ORDER
                  <input
                    type="number"
                    defaultValue={item.displayOrder}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== item.displayOrder) reorder(item, e.target.value);
                    }}
                    className="input-dark !w-20 !py-1"
                  />
                </label>
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
