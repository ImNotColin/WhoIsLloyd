import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const STORAGE_PATH = process.env.STORAGE_PATH || '/storage';

// Drone footage is large — allow up to 10GB per file (Nginx must match:
// client_max_body_size 10G).
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeName(originalname) {
  const ext = path.extname(originalname).toLowerCase().slice(0, 10);
  const base = path
    .basename(originalname, path.extname(originalname))
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 80);
  return `${base}_${crypto.randomBytes(4).toString('hex')}${ext}`;
}

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

export const clientUpload = multer({
  storage: storageFor((req) => `uploads/clients/${req.params.id}`),
  limits: { fileSize: MAX_FILE_SIZE },
});

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
