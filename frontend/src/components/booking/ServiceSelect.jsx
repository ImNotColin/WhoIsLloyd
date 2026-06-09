import { SERVICES } from '../../content.js';

export default function ServiceSelect({ value, onSelect }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {SERVICES.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onSelect(s.key)}
          className={`text-left p-6 border transition-all duration-300 ${
            value === s.key
              ? 'border-gold bg-gold/10'
              : 'border-line bg-surface hover:border-gold/50'
          }`}
        >
          <div className="heading-display text-2xl mb-2">{s.name}</div>
          <p className="text-muted text-sm leading-relaxed line-clamp-2">{s.description}</p>
        </button>
      ))}
    </div>
  );
}
