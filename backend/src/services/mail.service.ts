import { transporter, MAIL_FROM } from '../config/mail';

export async function sendWelcomeEmail(to: string) {
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Welcome to Maintenance Tracker',
    text: 'Your account is ready. You can now log in and add your first bike.',
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Reset your password',
    text: `Use this link to reset your password:\n${resetLink}\n\nIf you did not request this, ignore this email.`,
  });
}
