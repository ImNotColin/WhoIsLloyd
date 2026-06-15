# DRONES BY COLIN

Cinematic single-scroll site + booking system + client portal + admin panel for
**Drones by Colin** — aerial cinematography in Bryan/College Station, TX.

```
frontend/   React (Vite) · GSAP ScrollTrigger · Tailwind · React Router · Axios · Leaflet
backend/    Node · Express · Prisma · PostgreSQL · JWT · Multer · Nodemailer · Google Calendar
nginx/      Production reverse-proxy config
```

## Local development

Requirements: Node.js 20+, PostgreSQL (or `docker compose up postgres`).

```bash
# 1. Database (option A: docker)
POSTGRES_PASSWORD=devpass docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env        # fill in values — see "Environment" below
npm install
npx prisma migrate dev      # creates tables
node prisma/seed.js         # creates admin account + placeholder portfolio
npm run dev                 # API on :3001

# 3. Frontend (second terminal)
cd frontend
npm install
npm run dev                 # site on :5173, /api proxied to :3001
```

Log in at `/portal` with `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` — you'll be
forced to set a new password, then land in `/admin`.

## Environment

Copy `backend/.env.example` to `backend/.env`. Notes on the non-obvious ones:

| Variable | How to get it |
| --- | --- |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | `openssl rand -base64 64` (two different values) |
| `GMAIL_APP_PASSWORD` | Google Account → Security → 2-Step Verification → **App Passwords**. This is NOT the Gmail account password — app passwords only work with 2FA enabled. |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth client (Web). Enable the **Google Calendar API**. Add `GOOGLE_REDIRECT_URI` as an authorized redirect URI. |
| `ADMIN_INITIAL_PASSWORD` | Set before seeding; change immediately after first login (the app forces this). |

Google Calendar is the **only** external service needing credentials.
Everything else is free or self-hosted.

## Deployment (Raspberry Pi 5 / Ubuntu Server)

1. Clone repo to the server.
2. Install Node.js 20+, PostgreSQL, Nginx, PM2 (`npm i -g pm2`).
3. Create the storage tree and drop in a stock hero clip:
   ```bash
   sudo mkdir -p /storage/uploads/{portfolio/{thumbnails,videos},clients,settings} /storage/stock
   # free placeholder hero footage (Pexels, no key needed):
   curl -L -o /storage/stock/hero.mp4 "https://www.pexels.com/download/video/3129957/"
   sudo chown -R $USER /storage
   ```
4. `cd backend && cp .env.example .env` and fill all values, then
   `npm install && npx prisma migrate deploy && node prisma/seed.js`
5. `cd frontend && npm install && npm run build`, then copy `dist/` to
   `/var/www/dronesbycolin/dist`
6. `sudo cp nginx/dronesbycolin.conf /etc/nginx/sites-available/` and symlink
   into `sites-enabled`, `sudo nginx -t && sudo systemctl reload nginx`
7. `sudo certbot --nginx -d dronesbycolin.com -d www.dronesbycolin.com`
8. `cd backend && pm2 start src/app.js --name dronesbycolin-api`
9. `pm2 save && pm2 startup`
10. In `/admin/settings`, click **Connect Calendar** and complete the Google
    OAuth flow.
11. Change the admin password immediately (forced on first login).

### Analytics (Umami, self-hosted)

```bash
docker compose up -d umami umami-db
```

Runs on `127.0.0.1:3100` — point an nginx server block (e.g.
`analytics.dronesbycolin.com`) at it, create the site in Umami's dashboard,
then paste the tracking snippet into `frontend/index.html` (a commented
placeholder is already there). Cookieless and GDPR-compliant.

## Booking business rules (enforced frontend AND backend)

1. No booking within 7 calendar days of today — hard block (frontend calendar
   disables the dates; backend rejects regardless).
2. Max 2 bookings/day: one AM (8am–12pm CT), one PM (1pm–5pm CT).
3. Only weekdays toggled on in Admin → Availability are bookable
   (default: Sat/Sun).
4. Blocked dates always win.
5. Shoot notes required, minimum 20 characters.
6. Every booking: confirmation email to client, notification email to
   DronesByColin@gmail.com, Google Calendar event (America/Chicago).

## Security

- Admin routes require a JWT with `role: ADMIN`; portal routes require a JWT
  matching the client's own id.
- Client delivery files are served **only** through the authenticated
  `/api/portal/files/:id` endpoint — never statically.
- bcrypt (12 rounds), 15-min access tokens + 7-day refresh tokens,
  rate-limited auth (10 attempts / 15 min), Helmet headers, zod input
  validation, Prisma parameterized queries.
- No public registration anywhere. Client accounts are created by the admin
  only, with a forced password change on first login.

## Content placeholders

The seed script fills the portfolio with free Pexels aerial clips and the hero
falls back to a Pexels stream until `/storage/stock/hero.mp4` exists. Replace
everything from **Admin → Portfolio** — paths live in the DB, nothing is
hardcoded.

The hero tagline lives in `frontend/src/content.js` (`TAGLINE`), along with
all site copy.
