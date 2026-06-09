import nodemailer from 'nodemailer';
import { SLOT_TIMES } from '../utils/dateUtils.js';

const SERVICE_LABELS = {
  REAL_ESTATE: 'Real Estate',
  EVENTS: 'Events',
  CONSTRUCTION: 'Construction',
  WEDDINGS: 'Weddings',
};

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export function emailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

async function send(mail) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping:', mail.subject);
    return false;
  }
  await transporter.sendMail({
    from: `"Drones by Colin" <${process.env.GMAIL_USER}>`,
    ...mail,
  });
  return true;
}

function bookingSummary(booking) {
  const date = booking.date.toISOString().slice(0, 10);
  return [
    `Service:  ${SERVICE_LABELS[booking.service]}`,
    `Date:     ${date}`,
    `Slot:     ${SLOT_TIMES[booking.slot].label}`,
    `Name:     ${booking.clientName}`,
    `Phone:    ${booking.phone}`,
    `Email:    ${booking.email}`,
    '',
    'Shoot notes:',
    booking.notes,
  ].join('\n');
}

export async function sendBookingConfirmation(booking) {
  return send({
    to: booking.email,
    subject: 'Your shoot is booked — Drones by Colin',
    text: [
      `Hi ${booking.clientName},`,
      '',
      'Your aerial shoot request is in. Here are the details:',
      '',
      bookingSummary(booking),
      '',
      "We'll call you before your shoot day to go over the details.",
      'Need anything sooner? Call (903) 520-9328.',
      '',
      '— Colin',
      'Drones by Colin · Bryan/College Station, TX',
    ].join('\n'),
  });
}

export async function sendBookingNotification(booking) {
  return send({
    to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
    subject: `NEW BOOKING — ${SERVICE_LABELS[booking.service]} — ${booking.clientName}`,
    text: bookingSummary(booking),
  });
}

export async function sendContactEmail({ name, email, phone, message }) {
  return send({
    to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
    replyTo: email,
    subject: `Website contact — ${name}`,
    text: [`Name:  ${name}`, `Email: ${email}`, `Phone: ${phone}`, '', message].join('\n'),
  });
}
