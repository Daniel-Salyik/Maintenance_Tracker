import nodemailer from 'nodemailer';
import 'dotenv/config';

export const MAIL_FROM = process.env.MAIL_FROM ?? 'Maintenance Tracker <no-reply@localhost>';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === 'true',
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});
