// Small shared pieces for the admin panel — clean, functional Tailwind UI.
import { SERVICE_LABELS } from '../../content.js';

export function PageTitle({ children }) {
  return <h1 className="heading-display text-4xl mb-8">{children}</h1>;
}

export function Card({ title, children, className = '' }) {
  return (
    <section className={`bg-surface border border-line p-6 ${className}`}>
      {title && <h2 className="section-kicker mb-5">{title}</h2>}
      {children}
    </section>
  );
}

export function Button({ children, danger = false, className = '', ...props }) {
  return (
    <button
      className={`font-mono text-xs tracking-wide2 uppercase px-4 py-2 border transition-all
        disabled:opacity-40 disabled:cursor-not-allowed ${
          danger
            ? 'border-red-900 text-red-400 hover:bg-red-950'
            : 'border-gold/50 text-gold hover:bg-gold hover:text-ink'
        } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ServiceTag({ service }) {
  return (
    <span className="font-mono text-[10px] tracking-wide2 uppercase text-gold border border-gold/30 px-2 py-0.5">
      {SERVICE_LABELS[service]}
    </span>
  );
}

const STATUS_COLORS = {
  PENDING: 'text-yellow-400 border-yellow-900',
  CONFIRMED: 'text-gold border-gold/40',
  COMPLETED: 'text-green-400 border-green-900',
  CANCELLED: 'text-muted border-line',
};

export function StatusTag({ status }) {
  return (
    <span
      className={`font-mono text-[10px] tracking-wide2 uppercase border px-2 py-0.5 ${STATUS_COLORS[status]}`}
    >
      {status}
    </span>
  );
}

export function Feedback({ value }) {
  if (!value) return null;
  return (
    <p
      className={`font-mono text-xs tracking-wide2 mt-4 ${
        value.ok ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {value.message}
    </p>
  );
}

export function formatDateOnly(iso) {
  return String(iso).slice(0, 10);
}
