import { findById, updatePreferences as updatePreferencesRepo } from '../repositories/user.repository';
import { HttpError } from '../utils/http-error';

const DISTANCE_UNITS: Record<string, string> = {
  miles: 'mi',
  kilometers: 'km',
  mi: 'mi',
  km: 'km',
};

const CURRENCIES = ['USD', 'EUR', 'GBP'];

export async function getMe(userId: string) {
  await findById(userId);
  return { welcomeMessage: 'Welcome back!' };
}

export async function getProfile(userId: string) {
  const user = await findById(userId);
  return {
    id: user.id,
    email: user.email,
    distanceUnit: user.distance_unit,
    currency: user.currency,
  };
}

export async function getDashboard(userId: string) {
  const user = await findById(userId);
  return {
    units: user.distance_unit,
    currency: user.currency,
  };
}

export async function updatePreferences(
  userId: string,
  patch: { distanceUnit?: string; currency?: string }
) {
  const fields: Record<string, string> = {};

  if (patch.distanceUnit !== undefined) {
    const normalized = DISTANCE_UNITS[patch.distanceUnit.toLowerCase()];
    if (!normalized) {
      throw new HttpError(400, 'Invalid distance unit');
    }
    fields.distance_unit = normalized;
  }

  if (patch.currency !== undefined) {
    if (!CURRENCIES.includes(patch.currency)) {
      throw new HttpError(400, 'Invalid currency code');
    }
    fields.currency = patch.currency;
  }

  if (Object.keys(fields).length === 0) {
    return findById(userId);
  }

  return updatePreferencesRepo(userId, fields);
}
