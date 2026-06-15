// AdminBloopers.jsx — the admin side of the outtake reel. Upload, title, delete.
// The video is the joke; the title is just context for which joke it is.

import { useEffect, useState } from 'react';
import {
  adminGetBloopers,
  adminCreateBlooper,
  adminUpdateBlooper,
  adminDeleteBlooper,
  apiError,
} from '../../services/api.js';
import { PageTitle, Card, Button, Feedback } from './ui.jsx';

export default function AdminBloopers() {
  const [bloopers, setBloopers] = useState([]);
  const [title, setTitle] = useState('');
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  /* ───── edit state ───── */
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFeedback, setEditFeedback] = useState(null);

  const refresh = () => adminGetBloopers().then(setBloopers).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  /* ───── upload ───── */

  const create = async (e) => {
    e.preventDefault();
    if (!video) {
      setFeedback({ ok: false, message: 'Pick a video file first' });
      return;
    }
    const fd = new FormData();
    fd.append('title', title);
    fd.append('video', video);
    setUploading(0);
    try {
      await adminCreateBlooper(fd, (e2) => {
        if (e2.total) setUploading(Math.round((e2.loaded / e2.total) * 100));
      });
      setFeedback({ ok: true, message: 'Blooper uploaded' });
      setTitle('');
      setVideo(null);
      e.target.reset();
      refresh();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    } finally {
      setUploading(null);
    }
  };

  /* ───── edit ───── */

  const openEdit = (b) => {
    setEditId(b.id);
    setEditTitle(b.title);
    setEditFeedback(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditFeedback(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await adminUpdateBlooper(editId, { title: editTitle });
      setEditFeedback({ ok: true, message: 'Saved' });
      refresh();
      setTimeout(cancelEdit, 800);
    } catch (err) {
      setEditFeedback({ ok: false, message: apiError(err) });
    }
  };

  /* ───── delete ───── */

  const remove = async (b) => {
    if (!window.confirm(`Delete "${b.title}"?`)) return;
    try {
      await adminDeleteBlooper(b.id);
      if (editId === b.id) cancelEdit();
      refresh();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  /* ───── render ───── */

  return (
    <>
      <PageTitle>BLOOPERS</PageTitle>

      <Card title="UPLOAD BLOOPER" className="mb-6">
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-dark">Title</label>
            <input
              required
              className="input-dark"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Drone vs. tree — round one"
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
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" disabled={uploading !== null}>
              {uploading !== null ? `Uploading ${uploading}%` : 'Upload'}
            </Button>
          </div>
        </form>
        <Feedback value={feedback} />
      </Card>

      <Card title={`ALL BLOOPERS (${bloopers.length})`}>
        {bloopers.length === 0 ? (
          <p className="text-muted text-sm">No bloopers yet. The flights have all been perfect.</p>
        ) : (
          <ul className="divide-y divide-line">
            {bloopers.map((b) => (
              <li key={b.id}>
                {/* ── blooper row ── */}
                <div className="py-4 flex flex-wrap items-center gap-4">
                  {/* First frame as thumbnail — the browser handles it. */}
                  <video
                    className="w-24 aspect-video object-cover border border-line bg-black shrink-0"
                    src={b.videoPath}
                    muted
                    preload="metadata"
                  />
                  <div className="flex-1 min-w-[160px] text-bone">{b.title}</div>
                  <Button onClick={() => (editId === b.id ? cancelEdit() : openEdit(b))}>
                    {editId === b.id ? 'Cancel' : 'Edit'}
                  </Button>
                  <Button danger onClick={() => remove(b)}>
                    Delete
                  </Button>
                </div>

                {/* ── inline title edit ── */}
                {editId === b.id && (
                  <form
                    onSubmit={saveEdit}
                    className="pb-4 pt-1 pl-28 flex flex-wrap items-end gap-4 border-t border-line"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <label className="label-dark">Title</label>
                      <input
                        required
                        className="input-dark"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <Button type="submit">Save</Button>
                    <Button type="button" onClick={cancelEdit}>Cancel</Button>
                    <div className="w-full">
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
