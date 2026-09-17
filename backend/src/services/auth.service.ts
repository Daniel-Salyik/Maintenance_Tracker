import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findByEmail } from '../repositories/user.repository';
import { HttpError } from '../utils/http-error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
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
  const user = await createUser(email, passwordHash);
  return signToken(user.id);
}

export async function login(email: string, password: string) {
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
