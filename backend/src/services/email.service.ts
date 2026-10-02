import { Resend } from 'resend';

interface Email {
  to: string;
  subject: string;
  html: string;
}

// Never throws: email failure must not break the calling request.
export async function sendEmail({ to, subject, html }: Email): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const resend = new Resend(process.env.RESEND_API);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
    if (error) console.error('Resend error:', error);
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

export const sendWelcomeEmail = (to: string) =>
  sendEmail({
    to,
    subject: 'Welcome to Bike Maintenance Tracker',
    html: '<p>Welcome! Your account is ready. Add your bike and start tracking its maintenance.</p>',
  });

export const sendPasswordResetEmail = (to: string, link: string) =>
  sendEmail({
    to,
    subject: 'Reset your password',
    html: `<p>Click the link to reset your password. It expires in 1 hour.</p><p><a href="${link}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
  });
