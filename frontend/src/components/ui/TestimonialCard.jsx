import { SERVICE_LABELS } from '../../content.js';

function Stars({ rating }) {
  return (
    <div className="flex gap-1 text-gold" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`w-4 h-4 ${i < rating ? 'fill-gold' : 'fill-line'}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCard({ testimonial }) {
  return (
    <figure
      data-reveal
      className="bg-surface border border-line p-8 flex flex-col gap-5 min-w-[300px] md:min-w-[380px] snap-start"
    >
      <Stars rating={testimonial.rating} />
      <blockquote className="text-bone/90 leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-auto">
        <div className="font-display tracking-cinematic text-xl text-bone">
          {testimonial.clientName}
        </div>
        <div className="font-mono text-xs tracking-wide2 uppercase text-gold-dim">
          {SERVICE_LABELS[testimonial.service]}
        </div>
      </figcaption>
    </figure>
  );
}
