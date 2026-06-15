// Navigation.jsx — the corner MENU trigger and the fullscreen overlay it
// summons. The overlay sweeps down from above like weather; the links stagger
// in once it has settled.
//
// The logo also has a secret: three clicks in under 1.5 seconds unlocks the
// bloopers page for the current browser session. Refresh and it's gone again.

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../../hooks/useScrollAnimation.js';
import Logo from '../ui/Logo.jsx';

// Flight plan for the menu. Anchor links scroll the homepage; `to` links leave it.
const BASE_LINKS = [
  { label: 'HOME', anchor: 'hero' },
  { label: 'SERVICES', anchor: 'services' },
  { label: 'THE WORK', anchor: 'work' },
  { label: 'ABOUT', anchor: 'about' },
  { label: 'BOOK A SHOOT', to: '/booking' },
  { label: 'CLIENT LOGIN', to: '/portal' },
];

const BLOOPER_LINK = { label: 'BLOOPERS', to: '/bloopers' };

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [bloopersUnlocked, setBloopersUnlocked] = useState(
    () => sessionStorage.getItem('bloopersUnlocked') === 'true'
  );
  const overlayRef = useRef(null);
  const linksRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const close = useCallback(() => setOpen(false), []);

  // The links shown in the menu — BLOOPERS appears only after the unlock.
  const links = bloopersUnlocked ? [...BASE_LINKS, BLOOPER_LINK] : BASE_LINKS;

  const handleSecretUnlock = () => {
    sessionStorage.setItem('bloopersUnlocked', 'true');
    setBloopersUnlocked(true);
  };

  // Overlay choreography. Open: sweep down from -100% and stagger the links in
  // 70ms apart — six links arriving simultaneously reads as a crash, not a
  // landing. Reduced-motion users get an instant transform and zero theatrics.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (prefersReducedMotion()) {
      overlay.style.transform = open ? 'translateY(0)' : 'translateY(-100%)';
      return;
    }
    if (open) {
      gsap.set(overlay, { display: 'flex' });
      gsap.fromTo(
        overlay,
        { yPercent: -100 },
        { yPercent: 0, duration: 0.6, ease: 'power4.inOut' }
      );
      gsap.fromTo(
        linksRef.current.children,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, delay: 0.35, ease: 'power3.out' }
      );
    } else {
      gsap.to(overlay, { yPercent: -100, duration: 0.5, ease: 'power4.inOut' });
    }
  }, [open]);

  // ESC bails out of the overlay, and body scroll locks while it's up so the
  // page underneath holds its position until the menu clears the airspace.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  // Route links navigate outright. Anchor links smooth-scroll if we're already
  // on the homepage; otherwise we hand the router a hash and let it taxi over.
  const goTo = (link) => {
    close();
    if (link.to) {
      navigate(link.to);
    } else if (location.pathname === '/') {
      document.getElementById(link.anchor)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${link.anchor}`);
    }
  };

  return (
    <>
      {/* Corner trigger — always on station, deliberately quiet. The header
          strip is pointer-events-none so clicks pass through the empty middle;
          only the logo and MENU button actually catch anything. */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 md:px-10 py-5 pointer-events-none">
        <Link to="/" className="pointer-events-auto text-gold" aria-label="Drones by Colin — home">
          <Logo size={42} onSecretUnlock={handleSecretUnlock} />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto font-mono text-xs tracking-wide2 text-bone/80 hover:text-gold
            transition-colors flex items-center gap-3"
          aria-label="Open menu"
          aria-expanded={open}
        >
          MENU
          <span className="flex flex-col gap-[5px]">
            <span className="block w-6 h-px bg-current" />
            <span className="block w-6 h-px bg-current" />
          </span>
        </button>
      </header>

      {/* Fullscreen overlay. Ships hidden and translated off-screen so first
          paint never flashes the menu at anyone who didn't ask for it. */}
      <nav
        ref={overlayRef}
        className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-sm flex-col items-center justify-center hidden"
        style={{ display: open ? 'flex' : undefined, transform: 'translateY(-100%)' }}
        aria-hidden={!open}
      >
        {/* Faint drone silhouette at 4% opacity — present, like any good pilot,
            without drawing attention to itself. */}
        <svg
          viewBox="0 0 200 200"
          className="absolute w-[70vmin] h-[70vmin] text-bone opacity-[0.04] pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="28" />
          <circle cx="150" cy="50" r="28" />
          <circle cx="50" cy="150" r="28" />
          <circle cx="150" cy="150" r="28" />
          <rect x="85" y="85" width="30" height="30" rx="6" />
          <path d="M70 70l15 15m45-15l-15 15M70 130l15-15m45 15l-15-15" />
        </svg>

        <button
          onClick={close}
          aria-label="Close menu"
          className="absolute top-5 right-6 md:right-10 text-bone/70 hover:text-gold transition-colors
            text-5xl font-display leading-none"
        >
          ×
        </button>

        <ul ref={linksRef} className="relative flex flex-col items-center gap-2 md:gap-4">
          {links.map((link) => (
            <li key={link.label}>
              <button
                onClick={() => goTo(link)}
                className="font-display text-5xl md:text-7xl tracking-cinematic text-bone
                  hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="absolute bottom-8 font-mono text-xs tracking-wide2 text-muted">
          BRYAN / COLLEGE STATION · TX
        </div>
      </nav>
    </>
  );
}
