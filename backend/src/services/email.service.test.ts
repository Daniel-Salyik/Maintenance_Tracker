import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const send = vi.fn();
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendEmail } from './email.service';

const msg = { to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>' };

describe('sendEmail', () => {
  const env = { ...process.env };

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: '1' }, error: null });
    process.env.NODE_ENV = 'development';
    process.env.RESEND_API = 're_test';
    delete process.env.RESEND_FROM;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('sends via Resend with default from address', async () => {
    await sendEmail(msg);
    expect(send).toHaveBeenCalledWith({ from: 'onboarding@resend.dev', ...msg });
  });

  it('uses RESEND_FROM when set', async () => {
    process.env.RESEND_FROM = 'noreply@example.com';
    await sendEmail(msg);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ from: 'noreply@example.com' }));
  });

  it('skips sending when NODE_ENV is test', async () => {
    process.env.NODE_ENV = 'test';
    await sendEmail(msg);
    expect(send).not.toHaveBeenCalled();
  });

  it('logs and swallows a thrown error', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    send.mockRejectedValue(new Error('boom'));
    await expect(sendEmail(msg)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
  });

  it('logs and swallows an error returned by Resend', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    send.mockResolvedValue({ data: null, error: { message: 'bad key' } });
    await expect(sendEmail(msg)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
  });
});
