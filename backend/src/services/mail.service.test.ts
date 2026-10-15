import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
}));

vi.mock('../config/mail', () => ({
  transporter: { sendMail: mockSendMail },
  MAIL_FROM: 'Maintenance Tracker <no-reply@localhost>',
}));

import { sendWelcomeEmail, sendPasswordResetEmail } from './mail.service';

beforeEach(() => {
  mockSendMail.mockReset();
  mockSendMail.mockResolvedValue({});
});

describe('sendWelcomeEmail', () => {
  it('sends a welcome message to the given address', async () => {
    await sendWelcomeEmail('a@b.com');

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Maintenance Tracker <no-reply@localhost>',
        to: 'a@b.com',
        subject: expect.stringMatching(/welcome/i),
        text: expect.any(String),
      }),
    );
  });

  it('propagates a transport failure to the caller', async () => {
    const failure = new Error('smtp down');
    mockSendMail.mockRejectedValueOnce(failure);

    await expect(sendWelcomeEmail('a@b.com')).rejects.toBe(failure);
  });
});

describe('sendPasswordResetEmail', () => {
  it('sends a reset message that contains the reset link', async () => {
    await sendPasswordResetEmail('a@b.com', 'http://localhost:5173/reset?token=abc');

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const message = mockSendMail.mock.calls[0][0];
    expect(message.to).toBe('a@b.com');
    expect(message.subject).toMatch(/reset/i);
    expect(message.text).toContain('http://localhost:5173/reset?token=abc');
  });

  it('propagates a transport failure to the caller', async () => {
    const failure = new Error('smtp down');
    mockSendMail.mockRejectedValueOnce(failure);

    await expect(sendPasswordResetEmail('a@b.com', 'http://localhost:5173/reset?token=abc')).rejects.toBe(failure);
  });
});
