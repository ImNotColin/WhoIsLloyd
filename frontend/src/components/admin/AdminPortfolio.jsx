// AdminPortfolio.jsx — the portfolio back office. Thumbnail + video go up as
// multipart FormData with a progress readout; ordering is a number field that
// commits on blur. Editing a title or swapping a thumbnail: the Edit button.
// Swapping a video: that's what Delete is for.

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
  const [clips, setClips] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [thumbnail, setThumbnail] = useState(null);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  /* ───── edit state ───── */
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [editThumbnail, setEditThumbnail] = useState(null);
  const [editUploading, setEditUploading] = useState(null);
  const [editFeedback, setEditFeedback] = useState(null);

  const refreshPortfolio = () => adminGetPortfolioItems().then(setClips).catch(() => {});
  useEffect(() => {
    refreshPortfolio();
  }, []);

  /* ───── create ───── */

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
      refreshPortfolio();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    } finally {
      setUploading(null);
    }
  };

  /* ───── edit ───── */

  const openEdit = (item) => {
    setEditId(item.id);
    setEditForm({ title: item.title, category: item.category, displayOrder: item.displayOrder });
    setEditThumbnail(null);
    setEditFeedback(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditThumbnail(null);
    setEditFeedback(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    // If a new thumbnail was selected, send multipart so the server can
    // save the file. Otherwise, plain JSON is cleaner and has no size cost.
    let payload;
    let onProgress;
    if (editThumbnail) {
      payload = new FormData();
      payload.append('title', editForm.title);
      payload.append('category', editForm.category);
      payload.append('displayOrder', String(editForm.displayOrder));
      payload.append('thumbnail', editThumbnail);
      onProgress = (e2) => {
        if (e2.total) setEditUploading(Math.round((e2.loaded / e2.total) * 100));
      };
      setEditUploading(0);
    } else {
      payload = { ...editForm, displayOrder: Number(editForm.displayOrder) };
    }

    try {
      await adminUpdatePortfolio(editId, payload, onProgress);
      setEditFeedback({ ok: true, message: 'Saved' });
      refreshPortfolio();
      setTimeout(cancelEdit, 800);
    } catch (err) {
      setEditFeedback({ ok: false, message: apiError(err) });
    } finally {
      setEditUploading(null);
    }
  };

  /* ───── reorder ───── */

  // Reordering commits on blur, and only when the number actually changed —
  // no sense radioing the API about a tab-through.
  const reorder = async (item, displayOrder) => {
    try {
      await adminUpdatePortfolio(item.id, { displayOrder: Number(displayOrder) });
      refreshPortfolio();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  /* ───── delete ───── */

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await adminDeletePortfolio(item.id);
      if (editId === item.id) cancelEdit();
      refreshPortfolio();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  /* ───── render ───── */

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

      <Card title={`ALL ITEMS (${clips.length})`}>
        {clips.length === 0 ? (
          <p className="text-muted text-sm">Nothing in the portfolio yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {clips.map((item) => (
              <li key={item.id}>
                {/* ── item row ── */}
                <div className="py-4 flex flex-wrap items-center gap-4">
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
                        if (Number(e.target.value) !== item.displayOrder)
                          reorder(item, e.target.value);
                      }}
                      className="input-dark !w-20 !py-1"
                    />
                  </label>
                  <Button onClick={() => (editId === item.id ? cancelEdit() : openEdit(item))}>
                    {editId === item.id ? 'Cancel' : 'Edit'}
                  </Button>
                  <Button danger onClick={() => remove(item)}>
                    Delete
                  </Button>
                </div>

                {/* ── inline edit form — only visible for the active item ── */}
                {editId === item.id && (
                  <form
                    onSubmit={saveEdit}
                    className="pb-4 pt-1 pl-28 grid sm:grid-cols-2 gap-4 border-t border-line"
                  >
                    <div>
                      <label className="label-dark">Title</label>
                      <input
                        required
                        className="input-dark"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-dark">Category</label>
                      <select
                        className="input-dark"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        {SERVICES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-dark">Display Order</label>
                      <input
                        type="number"
                        className="input-dark"
                        value={editForm.displayOrder}
                        onChange={(e) =>
                          setEditForm({ ...editForm, displayOrder: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="label-dark">Replace Thumbnail (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="input-dark"
                        onChange={(e) => setEditThumbnail(e.target.files[0] || null)}
                      />
                    </div>
                    <div className="flex items-end gap-3 sm:col-span-2">
                      <Button type="submit" disabled={editUploading !== null}>
                        {editUploading !== null ? `Saving ${editUploading}%` : 'Save'}
                      </Button>
                      <Button type="button" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                    <div className="sm:col-span-2">
                      <Feedback value={editFeedback} />
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
