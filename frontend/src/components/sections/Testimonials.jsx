import { useEffect, useState } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation.js';
import TestimonialCard from '../ui/TestimonialCard.jsx';
import { getTestimonials } from '../../services/api.js';

export default function Testimonials() {
  const ref = useScrollAnimation();
  const [items, setItems] = useState([]);

  useEffect(() => {
    getTestimonials()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  // Per spec: hidden entirely until the first testimonial exists
  if (items.length === 0) return null;

  return (
    <section id="testimonials" ref={ref} className="py-24 md:py-32 px-6 bg-surface/40">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="section-kicker mb-4">04 / TESTIMONIALS</p>
        <h2 data-reveal className="heading-display text-5xl md:text-7xl mb-14">
          WHAT CLIENTS SAY
        </h2>
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
          {items.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
