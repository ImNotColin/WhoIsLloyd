import { useEffect, useRef } from 'react';

/** Fullscreen video player overlay. Closes on ESC, backdrop click, or X. */
export default function VideoLightbox({ item, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <button
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-5 right-6 text-bone/70 hover:text-gold transition-colors text-4xl font-display leading-none"
      >
        ×
      </button>
      <div
        className="w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={item.videoPath}
          poster={item.thumbnailPath}
          controls
          autoPlay
          playsInline
          className="w-full max-h-[80vh] bg-black border border-line"
        />
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="heading-display text-2xl md:text-3xl">{item.title}</h3>
          <span className="font-mono text-xs tracking-wide2 uppercase text-gold">
            {item.categoryLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
