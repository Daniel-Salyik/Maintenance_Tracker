import nodemailer from 'nodemailer';
import 'dotenv/config';

export const MAIL_FROM = process.env.MAIL_FROM ?? 'Maintenance Tracker <no-reply@localhost>';

// Test mode never opens a socket, so BDD runs without an SMTP server.
export const transporter =
  process.env.NODE_ENV === 'test'
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'localhost',
        port: Number(process.env.SMTP_PORT ?? 1025),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
