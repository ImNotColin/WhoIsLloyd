// Seeds the initial admin account, default settings, and Pexels placeholder
// portfolio items (all swappable from the admin panel).
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const pexelsImg = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1280`;
const pexelsVid = (file) => `https://videos.pexels.com/video-files/${file}.mp4`;

// Verified working Pexels CDN assets (free license, no API key)
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

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'DronesByColin@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminPassword) {
    throw new Error('Set ADMIN_INITIAL_PASSWORD in .env before seeding');
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      name: 'Colin Scharfenstine',
      role: 'ADMIN',
      mustResetPassword: true, // forces a password change on first login
    },
  });
  console.log(`Admin account ready: ${adminEmail}`);

  await prisma.availabilitySettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 }, // defaults: Sat/Sun available
  });

  await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

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
