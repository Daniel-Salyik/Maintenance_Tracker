import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockCreateTransport } = vi.hoisted(() => ({ mockCreateTransport: vi.fn() }));

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}));

// Keep a developer's local backend/.env from refilling variables the tests unset.
vi.mock('dotenv/config', () => ({}));

beforeEach(() => {
  vi.resetModules();
  mockCreateTransport.mockReset();
  mockCreateTransport.mockReturnValue({ sendMail: vi.fn() });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('mail transporter', () => {
  it('uses real SMTP (local Mailpit defaults) even when NODE_ENV is "test"', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SMTP_HOST', undefined);
    vi.stubEnv('SMTP_PORT', undefined);

    await import('./mail.js');

    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    const options = mockCreateTransport.mock.calls[0][0];
    expect(options).not.toHaveProperty('jsonTransport');
    expect(options).toMatchObject({
      host: 'localhost',
      port: 1025,
      secure: false,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });
  });

  it('reads host, port and credentials from the environment', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('SMTP_PORT', '587');
    vi.stubEnv('SMTP_USER', 'user');
    vi.stubEnv('SMTP_PASS', 'secret');

    await import('./mail.js');

    expect(mockCreateTransport.mock.calls[0][0]).toMatchObject({
      host: 'smtp.example.com',
      port: 587,
      auth: { user: 'user', pass: 'secret' },
    });
  });

  it('sends no auth block when credentials are not set', async () => {
    vi.stubEnv('SMTP_USER', undefined);
    vi.stubEnv('SMTP_PASS', undefined);

    await import('./mail.js');

    expect(mockCreateTransport.mock.calls[0][0].auth).toBeUndefined();
  });
});
