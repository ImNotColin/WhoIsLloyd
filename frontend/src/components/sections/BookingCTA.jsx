// BookingCTA.jsx — section 06, the big ask. One heading, one phone number,
// one gold button. The 7-day minimum is enforced in the booking flow itself;
// this section just files the flight plan early so nobody is surprised.

import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../../hooks/useScrollAnimation.js';
import GoldButton from '../ui/GoldButton.jsx';
import { BUSINESS } from '../../content.js';

export default function BookingCTA() {
  const ref = useScrollAnimation();
  const navigate = useNavigate();

  return (
    <section
      id="book"
      ref={ref}
      className="py-28 md:py-40 px-6 bg-surface/60 border-y border-line text-center"
    >
      <div className="max-w-3xl mx-auto">
        <p data-reveal className="section-kicker mb-4">06 / BOOKING</p>
        <h2 data-reveal className="heading-display text-6xl md:text-8xl mb-6">
          BOOK YOUR SHOOT
        </h2>
        <p data-reveal className="text-muted mb-3">
          Minimum 7 days advance booking required. Need something sooner? Call us directly.
        </p>
        <a
          data-reveal
          href={BUSINESS.phoneHref}
          className="block font-display tracking-cinematic text-4xl md:text-5xl text-gold
            hover:text-bone transition-colors my-8"
        >
          {BUSINESS.phone}
        </a>
        <div data-reveal>
          <GoldButton solid onClick={() => navigate('/booking')}>
            CHECK AVAILABILITY
          </GoldButton>
        </div>
      </div>
    </section>
  );
}
