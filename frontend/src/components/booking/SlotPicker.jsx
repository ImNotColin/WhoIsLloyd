// SlotPicker.jsx — wizard step 2: morning or afternoon. Two buttons, one
// decision. The noon hour belongs to neither slot; even the drone gets lunch.

const SLOTS = [
  { key: 'AM', name: 'MORNING', time: '8:00 AM – 12:00 PM' },
  { key: 'PM', name: 'AFTERNOON', time: '1:00 PM – 5:00 PM' },
];

export default function SlotPicker({ value, onSelect }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {SLOTS.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onSelect(s.key)}
          className={`p-8 border text-center transition-all duration-300 ${
            value === s.key
              ? 'border-gold bg-gold/10'
              : 'border-line bg-surface hover:border-gold/50'
          }`}
        >
          <div className="heading-display text-3xl mb-1">{s.name}</div>
          <div className="font-mono text-xs tracking-wide2 text-muted">{s.time}</div>
        </button>
      ))}
    </div>
  );
}
