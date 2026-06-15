// seed.js — first-flight setup: the admin account, default settings rows,
// and a placeholder portfolio of stock Pexels clips so the site doesn't
// launch looking abandoned. Everything here is replaceable from the admin
// panel; nothing is overwritten on re-run.

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/* ───── placeholder portfolio ───── */

const pexelsImg = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1280`;
const pexelsVid = (file) => `https://videos.pexels.com/video-files/${file}.mp4`;

// Verified working Pexels CDN assets (free license, no API key). Someone
// else's drone footage, standing in until Colin's replaces it — every URL
// was actually clicked before being committed.
const PLACEHOLDER_PORTFOLIO = [
  {
    title: 'Hilltop Estate — Golden Hour Reveal',
    category: 'REAL_ESTATE',
    thumbnailPath: pexelsImg(2437291),
    videoPath: pexelsVid('3571264/3571264-hd_1920_1080_30fps'),
    displayOrder: 1,
  },
  {
    title: 'Lakefront Property Flyover',
    category: 'REAL_ESTATE',
    thumbnailPath: pexelsImg(1105766),
    videoPath: pexelsVid('2257010/2257010-hd_1920_1080_24fps'),
    displayOrder: 2,
  },
  {
    title: 'Gameday — Stadium at Altitude',
    category: 'EVENTS',
    thumbnailPath: pexelsImg(2087391),
    videoPath: pexelsVid('854122/854122-hd_1920_1080_25fps'),
    displayOrder: 3,
  },
  {
    title: 'Festival Grounds — Crowd Sweep',
    category: 'EVENTS',
    thumbnailPath: pexelsImg(1387174),
    videoPath: pexelsVid('2867873/2867873-hd_1920_1080_24fps'),
    displayOrder: 4,
  },
  {
    title: 'Site Progress — Month Three',
    category: 'CONSTRUCTION',
    thumbnailPath: pexelsImg(681335),
    videoPath: pexelsVid('2257010/2257010-hd_1920_1080_24fps'),
    displayOrder: 5,
  },
  {
    title: 'Vineyard Vows — Ceremony From Above',
    category: 'WEDDINGS',
    thumbnailPath: pexelsImg(1130621),
    videoPath: pexelsVid('3129957/3129957-hd_1920_1080_25fps'),
    displayOrder: 6,
  },
];

/* ───── seed ───── */

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'DronesByColin@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  // Refuse to invent a default admin password. "admin/admin" is how
  // small-business sites end up hosting other people's crypto miners.
  if (!adminPassword) {
    throw new Error('Set ADMIN_INITIAL_PASSWORD in .env before seeding');
  }

  // upsert with empty update: re-seeding never clobbers the live admin
  // account or its (hopefully changed by now) password.
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      name: 'Colin Scharfenstine',
      role: 'ADMIN',
      mustResetPassword: true, // the .env password lasts exactly one login
    },
  });
  console.log(`Admin account ready: ${adminEmail}`);

  await prisma.availabilitySettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 }, // defaults: Sat/Sun available — the day-job schedule
  });

  await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  // Placeholders only land in a virgin table. Once Colin has uploaded a
  // single real clip, re-running the seed leaves the portfolio alone.
  if ((await prisma.portfolioItem.count()) === 0) {
    await prisma.portfolioItem.createMany({ data: PLACEHOLDER_PORTFOLIO });
    console.log('Seeded placeholder portfolio (replace via admin panel)');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
