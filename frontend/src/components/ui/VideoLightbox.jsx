import { useEffect, useRef } from 'react';

/**
 * VideoLightbox — fullscreen video overlay for portfolio items. Closes on
 * ESC, backdrop click, or the ×: three clearly marked exits, per regulation.
 */
export default function VideoLightbox({ item, onClose }) {
  const videoRef = useRef(null);

  // ESC handler plus a body scroll lock for the duration. Cleanup restores
  // both — a page that can no longer scroll after the lightbox closes is a
  // support email waiting to be written.
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
      {/* stopPropagation keeps clicks on the player from reaching the
          backdrop's onClose — pausing a video should not also eject you. */}
      <div
        className="w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* autoPlay is allowed with sound here: the user clicked a thumbnail
            to get this far, and browsers honor a real gesture. Controls stay
            on, because commandeering playback is rude. */}
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
