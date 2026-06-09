import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { BUSINESS } from '../../content.js';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-gold">
          <Logo size={36} />
          <span className="font-display tracking-cinematic text-xl text-bone">
            DRONES BY COLIN
          </span>
        </div>

        <div className="font-mono text-xs tracking-wide2 text-muted text-center">
          © {new Date().getFullYear()} DRONES BY COLIN · {BUSINESS.area.toUpperCase()}
        </div>

        <div className="flex items-center gap-6 font-mono text-xs tracking-wide2">
          <Link to="/privacy" className="text-muted hover:text-gold transition-colors link-slide">
            PRIVACY
          </Link>
          <a
            href={BUSINESS.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-gold transition-colors link-slide"
          >
            INSTAGRAM
          </a>
        </div>
      </div>
    </footer>
  );
}
