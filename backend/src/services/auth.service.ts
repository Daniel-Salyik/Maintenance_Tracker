import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { createUser, findByEmail, setResetToken } from '../repositories/user.repository';
import { HttpError } from '../utils/http-error';
import { sendWelcomeEmail, sendPasswordResetEmail } from './email.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid email or password';

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
}

export async function register(email: string, password: string) {
  if (!EMAIL_RE.test(email)) {
    throw new HttpError(400, 'Invalid email format');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, 'Password does not meet strength requirements');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await createUser(email, passwordHash);
  void sendWelcomeEmail(email); // fire-and-forget, never throws
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

export async function issueResetToken(userId: string, ttlMs = RESET_TOKEN_TTL_MS) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await setResetToken(userId, tokenHash, new Date(Date.now() + ttlMs));
  return token;
}

export async function forgotPassword(email: string) {
  if (!EMAIL_RE.test(email)) {
    throw new HttpError(400, 'Invalid email format');
  }

  const user = await findByEmail(email);
  if (!user) return; // same outcome as success: do not reveal registered emails

  const token = await issueResetToken(user.id);

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  void sendPasswordResetEmail(email, `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`);
}
