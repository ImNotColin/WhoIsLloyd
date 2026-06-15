// upload.js — Multer configuration for everything clients and Colin throw
// at the disk: portfolio media, client deliverables, and one FAA license.
// Filenames are sanitized on arrival; we trust nobody's `originalname`.

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const STORAGE_PATH = process.env.STORAGE_PATH || '/storage';

// 10GB per file. A few minutes of 4K drone footage gets there faster than
// you'd hope. Nginx must agree (client_max_body_size 10G) or it will 413
// the request before we ever see it.
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

/* ───── helpers ───── */

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Strips the filename down to [a-zA-Z0-9-_], caps the length, and appends
// random hex. Kills path traversal, collisions, and whatever creative
// unicode the client's editing software exported. "final_FINAL_v2 (1).mp4"
// becomes something we can live with.
function safeName(originalname) {
  const ext = path.extname(originalname).toLowerCase().slice(0, 10);
  const base = path
    .basename(originalname, path.extname(originalname))
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 80);
  return `${base}_${crypto.randomBytes(4).toString('hex')}${ext}`;
}

// Disk storage with a per-request destination. The destination callback
// gets a try/catch because mkdirSync failing (disk full of drone footage,
// say) should surface as an upload error, not take down the process.
function storageFor(subdirFn) {
  return multer.diskStorage({
    destination(req, file, cb) {
      try {
        cb(null, ensureDir(path.join(STORAGE_PATH, subdirFn(req, file))));
      } catch (err) {
        cb(err);
      }
    },
    filename(_req, file, cb) {
      cb(null, safeName(file.originalname));
    },
  });
}

const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif|avif)$/;
const VIDEO_TYPES = /^video\//;

/* ───── uploaders ───── */

// Portfolio media: thumbnails and videos land in separate directories so
// Nginx cache rules can treat them differently.
export const portfolioUpload = multer({
  storage: storageFor((_req, file) =>
    file.fieldname === 'thumbnail'
      ? 'uploads/portfolio/thumbnails'
      : 'uploads/portfolio/videos'
  ),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (file.fieldname === 'thumbnail' && !IMAGE_TYPES.test(file.mimetype)) {
      return cb(new Error('Thumbnail must be an image'));
    }
    if (file.fieldname === 'video' && !VIDEO_TYPES.test(file.mimetype)) {
      return cb(new Error('Video must be a video file'));
    }
    cb(null, true);
  },
});

// Client deliverables, one directory per client id. No mimetype filter:
// Colin delivers whatever the shoot produced — video, RAW stills, zips.
export const clientUpload = multer({
  storage: storageFor((req) => `uploads/clients/${req.params.id}`),
  limits: { fileSize: MAX_FILE_SIZE },
});

// Blooper videos — stored separately from portfolio to keep the showreel
// footage from mingling with the outtake reel. Video-only; no images here.
export const blooperUpload = multer({
  storage: storageFor(() => 'uploads/bloopers'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (!VIDEO_TYPES.test(file.mimetype)) {
      return cb(new Error('Blooper must be a video file'));
    }
    cb(null, true);
  },
});

// The Part 107 license image. 50MB is generous for a photo of a card, and
// if the FAA ever issues a 10GB license we have bigger problems.
export const part107Upload = multer({
  storage: storageFor(() => 'uploads/settings'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!IMAGE_TYPES.test(file.mimetype)) {
      return cb(new Error('License must be an image'));
    }
    cb(null, true);
  },
});
