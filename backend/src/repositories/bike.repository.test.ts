import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/db', () => ({
  pool: { query: mockQuery },
}));

import { createBike, findAllByUser, findById, updateBike, deleteBike } from './bike.repository';

const USER_ID = 'user-1';
const BIKE_ID = 'bike-1';

const dbRow = {
  id: BIKE_ID,
  user_id: USER_ID,
  name: 'Old Commuter',
  frame_number: 'FR123456789',
  model_type: 'Road Bike',
  model_year: 2023,
  description: 'My main racing bike',
  specs: { tireWidth: '25mm' },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const mappedBike = {
  id: BIKE_ID,
  userId: USER_ID,
  name: 'Old Commuter',
  frameNumber: 'FR123456789',
  modelType: 'Road Bike',
  modelYear: 2023,
  description: 'My main racing bike',
  specs: { tireWidth: '25mm' },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  mockQuery.mockReset();
});

describe('createBike', () => {
  it('inserts the bike and returns a camelCase-mapped row', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    const result = await createBike(USER_ID, {
      name: 'Old Commuter',
      frameNumber: 'FR123456789',
      modelType: 'Road Bike',
      modelYear: 2023,
      description: 'My main racing bike',
      specs: { tireWidth: '25mm' },
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO bikes/i);
    expect(params).toEqual([
      USER_ID,
      'Old Commuter',
      'FR123456789',
      'Road Bike',
      2023,
      'My main racing bike',
      { tireWidth: '25mm' },
    ]);
    expect(result).toEqual(mappedBike);
  });

  it('defaults an absent name and description to null', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    await createBike(USER_ID, {
      frameNumber: 'FR123456789',
      modelType: 'Road Bike',
      modelYear: 2023,
      specs: { tireWidth: '25mm' },
    });

    const [, params] = mockQuery.mock.calls[0];
    expect(params[1]).toBeNull();
    expect(params[5]).toBeNull();
  });
});

describe('findAllByUser', () => {
  it('queries by user id and returns camelCase-mapped rows', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    const result = await findAllByUser(USER_ID);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/WHERE user_id = \$1/i);
    expect(params).toEqual([USER_ID]);
    expect(result).toEqual([mappedBike]);
  });

  it('returns an empty array when the user has no bikes', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await findAllByUser(USER_ID);

    expect(result).toEqual([]);
  });
});

describe('findById', () => {
  it('queries by id and returns a camelCase-mapped row when found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    const result = await findById(BIKE_ID);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/WHERE id = \$1/i);
    expect(params).toEqual([BIKE_ID]);
    expect(result).toEqual(mappedBike);
  });

  it('returns null when no row found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await findById('missing');

    expect(result).toBeNull();
  });
});

describe('updateBike', () => {
  it('maps a single camelCase field to its snake_case column', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    const result = await updateBike(BIKE_ID, { description: 'Retired, garage queen' });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/UPDATE bikes SET description = \$1 WHERE id = \$2 RETURNING \*/i);
    expect(params).toEqual(['Retired, garage queen', BIKE_ID]);
    expect(result).toEqual(mappedBike);
  });

  it('maps multiple camelCase fields in call order', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    await updateBike(BIKE_ID, { frameNumber: 'FR999', modelYear: 2024 });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/UPDATE bikes SET frame_number = \$1, model_year = \$2 WHERE id = \$3 RETURNING \*/i);
    expect(params).toEqual(['FR999', 2024, BIKE_ID]);
  });

  it('rejects a column name not on the allowlist, never touches the DB', async () => {
    await expect(
      updateBike(BIKE_ID, { "id = 'x'; DROP TABLE bikes;--": 'y' })
    ).rejects.toThrow();

    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('deleteBike', () => {
  it('deletes by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await deleteBike(BIKE_ID);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM bikes WHERE id = \$1/i);
    expect(params).toEqual([BIKE_ID]);
  });
});
