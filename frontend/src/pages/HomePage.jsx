import { Suspense, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../components/layout/Navigation.jsx';
import Footer from '../components/layout/Footer.jsx';
import Hero from '../components/sections/Hero.jsx';
import Services from '../components/sections/Services.jsx';
import Portfolio from '../components/sections/Portfolio.jsx';
import About from '../components/sections/About.jsx';
import Testimonials from '../components/sections/Testimonials.jsx';
import BookingCTA from '../components/sections/BookingCTA.jsx';
import Contact from '../components/sections/Contact.jsx';

// Leaflet is the heaviest thing on this page and the map lives below the
// fold. It can take the later flight.
const CoverageMap = lazy(() => import('../components/sections/CoverageMap.jsx'));

/**
 * The public site: one continuous cinematic scroll, hero to footer.
 * Section order below is the narrative order — change it and you've
 * re-edited the film.
 */
export default function HomePage() {
  const { hash } = useLocation();

  // Support /#section deep links (e.g. arriving from /booking via the nav).
  // The 100ms delay gives the sections one paint to claim their layout before
  // we measure where to scroll — otherwise we'd aim at coordinates that no
  // longer exist.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [hash]);

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <About />
        <Testimonials />
        {/* The fallback keeps the map's exact height (and its #coverage anchor)
            reserved, so the page doesn't lurch when Leaflet finally lands. */}
        <Suspense fallback={<div id="coverage" className="h-[520px]" />}>
          <CoverageMap />
        </Suspense>
        <BookingCTA />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
