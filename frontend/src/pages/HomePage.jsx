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

// Leaflet is heavy and the map sits below the fold — load it separately
const CoverageMap = lazy(() => import('../components/sections/CoverageMap.jsx'));

/** The public site: one continuous cinematic scroll. */
export default function HomePage() {
  const { hash } = useLocation();

  // Support /#section deep links (e.g. arriving from /booking via the nav)
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
