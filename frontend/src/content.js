// Site copy in one place — easy to tune without touching components.

// Three cinematic tagline options for Colin to pick from:
//   1. "ABOVE IT ALL."
//   2. "EVERY STORY LOOKS BETTER FROM UP HERE."
//   3. "THE SKY IS THE STUDIO."
export const TAGLINE = 'ABOVE IT ALL.';

export const BUSINESS = {
  name: 'DRONES BY COLIN',
  owner: 'Colin Scharfenstine',
  phone: '(903) 520-9328',
  phoneHref: 'tel:+19035209328',
  email: 'DronesByColin@gmail.com',
  instagram: '@DronesByColin',
  instagramUrl: 'https://instagram.com/DronesByColin',
  area: 'Bryan & College Station, Texas',
};

export const SERVICE_LABELS = {
  REAL_ESTATE: 'Real Estate',
  EVENTS: 'Events',
  CONSTRUCTION: 'Construction',
  WEDDINGS: 'Weddings',
};

export const SERVICES = [
  {
    key: 'REAL_ESTATE',
    name: 'Real Estate',
    description:
      'Listings that stop the scroll. Sweeping property reveals, lot-line context from altitude, and golden-hour flyovers that get buyers to book the showing.',
  },
  {
    key: 'EVENTS',
    name: 'Events',
    description:
      'Festivals, gamedays, and gatherings captured at scale. The energy of the crowd and the size of the moment — angles a ground camera will never touch.',
  },
  {
    key: 'CONSTRUCTION',
    name: 'Construction',
    description:
      'From breaking ground to ribbon cutting. Site overviews, milestone progress documentation, and detail passes your stakeholders can actually use.',
  },
  {
    key: 'WEDDINGS',
    name: 'Weddings',
    description:
      'Your day, framed as big as it feels. Cinematic venue reveals, ceremony establishing shots, and a final film worthy of the moment.',
  },
];

export const ABOUT_COPY = [
  "I'm Colin Scharfenstine — pilot, shooter, editor. One person, one drone, and an obsession with the frame nobody else can get.",
  'Aerial changed how I see everything. A house becomes an estate. A job site becomes progress you can measure. A wedding becomes the wide shot you remember it as. My job is to put your story at that altitude.',
  'Based in Bryan/College Station and FAA Part 107 certified — flights are legal, insured-area aware, and planned before the props ever spin.',
];

// Hero video: served from /storage/stock/hero.mp4 on the server; the remote
// Pexels clip below is the dev/preview fallback until real footage is loaded.
export const HERO_VIDEO_LOCAL = '/storage/stock/hero.mp4';
export const HERO_VIDEO_FALLBACK =
  'https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4';
export const HERO_POSTER =
  'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=1920';

// Coverage map (Bryan/College Station)
export const MAP_CENTER = [30.628, -96.3344];
export const MAP_ZOOM = 11;
export const COVERAGE_RADIUS_METERS = 48280; // ~30 miles
