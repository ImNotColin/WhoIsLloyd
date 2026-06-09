import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  adminGetSettings,
  adminUpdateSettings,
  adminUploadPart107,
  adminGetGoogleAuthUrl,
  apiError,
} from '../../services/api.js';
import { PageTitle, Card, Button, Feedback } from './ui.jsx';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ phone: '', email: '', instagram: '', businessHours: '' });
  const [feedback, setFeedback] = useState(null);
  const [searchParams] = useSearchParams();

  const load = () =>
    adminGetSettings()
      .then((data) => {
        setSettings(data);
        setForm({
          phone: data.phone,
          email: data.email,
          instagram: data.instagram,
          businessHours: data.businessHours,
        });
      })
      .catch(() => {});

  useEffect(() => {
    load();
    const cal = searchParams.get('calendar');
    if (cal === 'connected') setFeedback({ ok: true, message: 'Google Calendar connected' });
    if (cal === 'no_refresh_token')
      setFeedback({
        ok: false,
        message: 'Google did not return a refresh token — try reconnecting',
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      await adminUpdateSettings(form);
      setFeedback({ ok: true, message: 'Settings saved' });
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  const uploadLicense = async (file) => {
    if (!file) return;
    try {
      await adminUploadPart107(file);
      setFeedback({ ok: true, message: 'FAA Part 107 license image updated' });
      load();
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  const connectCalendar = async () => {
    try {
      const { url } = await adminGetGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setFeedback({ ok: false, message: apiError(err) });
    }
  };

  return (
    <>
      <PageTitle>SETTINGS</PageTitle>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="CONTACT INFO (SHOWN ON SITE)">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label-dark">Phone</label>
              <input className="input-dark" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label-dark">Email</label>
              <input type="email" className="input-dark" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label-dark">Instagram Handle</label>
              <input className="input-dark" value={form.instagram} onChange={set('instagram')} />
            </div>
            <div>
              <label className="label-dark">Business Hours Text</label>
              <input className="input-dark" value={form.businessHours} onChange={set('businessHours')} />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card title="GOOGLE CALENDAR">
            <p className="font-mono text-xs tracking-wide2 mb-4">
              STATUS:{' '}
              {!settings ? (
                <span className="text-muted">…</span>
              ) : !settings.calendar?.configured ? (
                <span className="text-red-400">OAUTH CREDENTIALS MISSING (.env)</span>
              ) : settings.calendar?.connected ? (
                <span className="text-green-400">CONNECTED</span>
              ) : (
                <span className="text-yellow-400">NOT CONNECTED</span>
              )}
            </p>
            <Button onClick={connectCalendar} disabled={!settings?.calendar?.configured}>
              {settings?.calendar?.connected ? 'Reconnect' : 'Connect Calendar'}
            </Button>
            <p className="mt-4 text-muted text-xs leading-relaxed">
              Booking events are created on the connected calendar automatically. Reconnect if
              events stop appearing.
            </p>
          </Card>

          <Card title="FAA PART 107 LICENSE IMAGE">
            {settings?.part107Path && (
              <img
                src={settings.part107Path}
                alt="FAA Part 107 license"
                className="max-w-xs border border-line mb-4"
              />
            )}
            <label className="inline-block">
              <span className="font-mono text-xs tracking-wide2 uppercase px-4 py-2 border border-gold/50 text-gold hover:bg-gold hover:text-ink transition-all cursor-pointer">
                {settings?.part107Path ? 'Replace Image' : 'Upload Image'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadLicense(e.target.files[0])}
              />
            </label>
            <p className="mt-4 text-muted text-xs">
              Shown framed in the About section. Without an upload, a styled
              &ldquo;FAA Part 107 Certified&rdquo; badge is displayed instead.
            </p>
          </Card>
        </div>
      </div>
      <Feedback value={feedback} />
    </>
  );
}
