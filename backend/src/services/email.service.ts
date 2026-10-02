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
