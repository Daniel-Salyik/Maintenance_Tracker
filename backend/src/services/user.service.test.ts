import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindById, mockUpdatePreferences } = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockUpdatePreferences: vi.fn(),
}));

vi.mock('../repositories/user.repository', () => ({
  findById: mockFindById,
  updatePreferences: mockUpdatePreferences,
}));

import { updatePreferences } from './user.service';

beforeEach(() => {
  mockFindById.mockReset();
  mockUpdatePreferences.mockReset();
});

describe('updatePreferences', () => {
  it('normalizes "Miles" to "mi" before writing', async () => {
    mockUpdatePreferences.mockResolvedValueOnce({ id: '1', distance_unit: 'mi' });

    await updatePreferences('1', { distanceUnit: 'Miles' });

    expect(mockUpdatePreferences).toHaveBeenCalledWith('1', { distance_unit: 'mi' });
  });

  it('normalizes "Kilometers" to "km" before writing', async () => {
    mockUpdatePreferences.mockResolvedValueOnce({ id: '1', distance_unit: 'km' });

    await updatePreferences('1', { distanceUnit: 'Kilometers' });

    expect(mockUpdatePreferences).toHaveBeenCalledWith('1', { distance_unit: 'km' });
  });

  it('rejects an unrecognized distance unit with HttpError 400, never touches the repository', async () => {
    await expect(updatePreferences('1', { distanceUnit: 'Parsecs' })).rejects.toMatchObject({ status: 400 });

    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  it('rejects an unrecognized currency with HttpError 400, never touches the repository', async () => {
    await expect(updatePreferences('1', { currency: 'XYZ' })).rejects.toMatchObject({ status: 400 });

    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  it('accepts a valid currency and writes it unchanged', async () => {
    mockUpdatePreferences.mockResolvedValueOnce({ id: '1', currency: 'USD' });

    await updatePreferences('1', { currency: 'USD' });

    expect(mockUpdatePreferences).toHaveBeenCalledWith('1', { currency: 'USD' });
  });

  it('is a no-op on an empty patch: skips the repository write, returns the current record', async () => {
    const current = { id: '1', distance_unit: 'km', currency: 'EUR' };
    mockFindById.mockResolvedValueOnce(current);

    const result = await updatePreferences('1', {});

    expect(mockUpdatePreferences).not.toHaveBeenCalled();
    expect(result).toEqual(current);
  });
});
