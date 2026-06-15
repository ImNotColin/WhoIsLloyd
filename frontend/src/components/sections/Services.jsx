// Services.jsx — section 01, "WHAT WE SHOOT". A kicker, a heading, and four
// service cards in a grid. The shortest section on the page, fittingly: we
// shoot four things and see no reason to pad the list.

import { useScrollAnimation } from '../../hooks/useScrollAnimation.js';
import ServiceCard from '../ui/ServiceCard.jsx';
import { SERVICES } from '../../content.js';

export default function Services() {
  // Wires up the data-reveal scroll-in animation for everything inside.
  const ref = useScrollAnimation();

  return (
    <section id="services" ref={ref} className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="section-kicker mb-4">01 / SERVICES</p>
        <h2 data-reveal className="heading-display text-5xl md:text-7xl mb-14">
          WHAT WE SHOOT
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s) => (
            <ServiceCard key={s.key} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
