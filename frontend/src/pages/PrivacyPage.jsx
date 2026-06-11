// PrivacyPage.jsx — the privacy policy. Static prose, no state, no effects.
// The policy itself is short because the data collection is short; for once,
// a privacy page whose length is proportional to what's actually collected.

import { Link } from 'react-router-dom';
import Navigation from '../components/layout/Navigation.jsx';
import Footer from '../components/layout/Footer.jsx';
import { BUSINESS } from '../content.js';

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="heading-display text-5xl md:text-6xl mb-10">PRIVACY POLICY</h1>
        <div className="space-y-6 text-bone/80 leading-relaxed">
          <p>
            Drones by Colin collects only the information you give us directly —
            your name, email, phone number, and shoot details when you book a
            shoot or send a message. We use it to schedule your shoot, contact
            you about it, and deliver your footage. Nothing else.
          </p>
          <p>
            We don&rsquo;t sell, rent, or share your information with anyone.
            Our website analytics are self-hosted, cookieless, and anonymous —
            we see page views, not people.
          </p>
          <p>
            Client portal accounts are created only by us, for delivering your
            footage. Passwords are stored hashed and your files are accessible
            only to you after logging in.
          </p>
          <p>
            Questions, or want your data removed? Call {BUSINESS.phone} or email{' '}
            <a href={`mailto:${BUSINESS.email}`} className="text-gold hover:underline">
              {BUSINESS.email}
            </a>
            .
          </p>
        </div>
        <Link
          to="/"
          className="inline-block mt-12 font-mono text-xs tracking-wide2 text-gold link-slide"
        >
          ← BACK TO SITE
        </Link>
      </main>
      <Footer />
    </>
  );
}
