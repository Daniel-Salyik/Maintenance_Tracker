import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createUser, findByEmail, findById, updatePassword } from '../repositories/user.repository';
import { createResetToken, findResetToken, deleteResetToken, deleteResetTokensByUserId, deleteExpiredResetTokens } from '../repositories/password-reset.repository';
import { HttpError } from '../utils/http-error';
import { sendPasswordResetEmail, sendWelcomeEmail } from './mail.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
const INVALID_CREDENTIALS = 'Invalid email or password';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
}

export async function register(email: string, password: string) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    throw new HttpError(400, 'Invalid email format');
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, 'Password does not meet strength requirements');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await createUser(email, passwordHash);

  // Fire-and-forget: a mail failure must not turn a created user into a 500.
  sendWelcomeEmail(email).catch((err) => console.error('welcome email failed', err));
}

export async function login(email: string, password: string) {
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required');
  }

  const user = await findByEmail(email);
  if (!user) {
    throw new HttpError(401, INVALID_CREDENTIALS);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new HttpError(401, INVALID_CREDENTIALS);
  }

  return signToken(user.id);
}

export async function forgotPassword(email: string) {
  if (typeof email !== 'string' || !email) {
    throw new HttpError(400, 'Email is required');
  }

  // Unknown email resolves silently so the endpoint never reveals which accounts exist.
  const user = await findByEmail(email);
  if (!user) {
    return;
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await createResetToken(user.id, tokenHash, new Date(Date.now() + RESET_TOKEN_TTL_MS));

  const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  sendPasswordResetEmail(user.email, `${baseUrl}/reset-password?token=${token}`).catch((err) =>
    console.error('password reset email failed', err)
  );
}

export async function resetPassword(token: string, password: string) {
  if (typeof token !== 'string' || !token) {
    throw new HttpError(400, 'Reset token is required');
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, 'Password does not meet strength requirements');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  await deleteExpiredResetTokens().catch(() => undefined);

  const resetToken = await findResetToken(tokenHash);
  if (!resetToken || new Date(resetToken.expires_at) <= new Date()) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }

  const user = await findById(resetToken.user_id);
  if (!user) {
    await deleteResetToken(tokenHash);
    throw new HttpError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await updatePassword(user.id, passwordHash);

  // Consume the token only after the password has been updated so a failed
  // update does not invalidate the user's reset link.
  await deleteResetToken(tokenHash);

  // Clear any remaining reset tokens for this account.
  await deleteResetTokensByUserId(user.id);
}

export async function validateResetToken(token: string) {
  if (typeof token !== 'string' || !token) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const resetToken = await findResetToken(tokenHash);
  if (!resetToken || new Date(resetToken.expires_at) <= new Date()) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }
}
