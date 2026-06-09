/**
 * Primary CTA. Outlined gold by default with a fill-sweep on hover;
 * `solid` renders filled from the start.
 */
export default function GoldButton({
  children,
  solid = false,
  className = '',
  ...props
}) {
  const base =
    'relative inline-flex items-center justify-center gap-3 font-display tracking-wide2 text-lg ' +
    'px-8 py-3 border transition-all duration-300 select-none ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed';
  const look = solid
    ? 'bg-gold text-ink border-gold hover:bg-bone hover:border-bone hover:shadow-[0_0_24px_rgba(201,168,76,0.45)]'
    : 'text-gold border-gold/70 hover:bg-gold hover:text-ink hover:shadow-[0_0_24px_rgba(201,168,76,0.35)]';

  return (
    <button className={`${base} ${look} ${className}`} {...props}>
      {children}
    </button>
  );
}
