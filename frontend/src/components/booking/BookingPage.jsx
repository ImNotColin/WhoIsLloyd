import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../layout/Navigation.jsx';
import Footer from '../layout/Footer.jsx';
import ServiceSelect from './ServiceSelect.jsx';
import SlotPicker from './SlotPicker.jsx';
import DatePicker from './DatePicker.jsx';
import BookingForm from './BookingForm.jsx';
import GoldButton from '../ui/GoldButton.jsx';
import { createBooking, apiError } from '../../services/api.js';
import { BUSINESS } from '../../content.js';

const STEPS = ['SERVICE', 'TIME SLOT', 'DATE', 'DETAILS'];

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [slot, setSlot] = useState(null);
  const [date, setDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const submit = async (form) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createBooking({ ...form, service, slot, date });
      setConfirmation(res.message);
    } catch (err) {
      setError(apiError(err, 'Booking failed — call us and we will get you scheduled.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <Shell>
        <div className="text-center py-20">
          <div className="text-gold text-6xl mb-8" aria-hidden="true">✓</div>
          <h1 className="heading-display text-5xl md:text-7xl mb-6">YOU&rsquo;RE BOOKED</h1>
          <p className="text-bone/80 max-w-md mx-auto mb-3">{confirmation}</p>
          <p className="text-muted text-sm mb-12">
            A confirmation email is on its way. Questions in the meantime?{' '}
            <a href={BUSINESS.phoneHref} className="text-gold hover:underline">
              {BUSINESS.phone}
            </a>
          </p>
          <Link to="/">
            <GoldButton>BACK TO SITE</GoldButton>
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="section-kicker mb-4">BOOKING</p>
      <h1 className="heading-display text-5xl md:text-7xl mb-10">BOOK YOUR SHOOT</h1>

      {/* step indicator */}
      <ol className="flex flex-wrap gap-x-6 gap-y-2 mb-12 font-mono text-[11px] tracking-wide2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 ${
              i === step ? 'text-gold' : i < step ? 'text-bone/70' : 'text-line'
            }`}
          >
            <span className={`w-5 h-5 border flex items-center justify-center text-[10px] ${
              i === step ? 'border-gold' : i < step ? 'border-bone/40' : 'border-line'
            }`}>
              {i < step ? '✓' : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <StepWrap title="What are we shooting?">
          <ServiceSelect
            value={service}
            onSelect={(v) => {
              setService(v);
              setStep(1);
            }}
          />
        </StepWrap>
      )}

      {step === 1 && (
        <StepWrap title="Morning or afternoon?" onBack={() => setStep(0)}>
          <SlotPicker
            value={slot}
            onSelect={(v) => {
              setSlot(v);
              setDate(null);
              setStep(2);
            }}
          />
        </StepWrap>
      )}

      {step === 2 && (
        <StepWrap title="Pick your date" onBack={() => setStep(1)}>
          <DatePicker
            slot={slot}
            value={date}
            onSelect={(v) => {
              setDate(v);
              setStep(3);
            }}
          />
        </StepWrap>
      )}

      {step === 3 && (
        <StepWrap title="Tell us about the shoot" onBack={() => setStep(2)}>
          <BookingForm
            service={service}
            slot={slot}
            date={date}
            onSubmit={submit}
            submitting={submitting}
            error={error}
          />
        </StepWrap>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <>
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

function StepWrap({ title, onBack, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="heading-display text-3xl text-bone/90">{title}</h2>
        {onBack && (
          <button
            onClick={onBack}
            className="font-mono text-xs tracking-wide2 text-muted hover:text-gold transition-colors"
          >
            ← BACK
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
