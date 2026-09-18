import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockCreateBike,
  mockFindAllByUser,
  mockFindById,
  mockUpdateBike,
  mockDeleteBike,
} = vi.hoisted(() => ({
  mockCreateBike: vi.fn(),
  mockFindAllByUser: vi.fn(),
  mockFindById: vi.fn(),
  mockUpdateBike: vi.fn(),
  mockDeleteBike: vi.fn(),
}));

vi.mock('../repositories/bike.repository', () => ({
  createBike: mockCreateBike,
  findAllByUser: mockFindAllByUser,
  findById: mockFindById,
  updateBike: mockUpdateBike,
  deleteBike: mockDeleteBike,
}));

import { createBike, listBikes, getBike, updateBike, deleteBike } from './bike.service';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const BIKE_ID = 'bike-1';

function validBikeData(overrides: Record<string, any> = {}) {
  return {
    frameNumber: 'FR123456789',
    modelType: 'Road Bike',
    modelYear: 2023,
    description: 'My main racing bike',
    specs: {
      brakeType: 'Disc',
      tireWidth: '25mm',
      userWeight: '75kg',
      numSpeeds: 12,
      shiftingType: 'Electronic',
    },
    ...overrides,
  };
}

beforeEach(() => {
  mockCreateBike.mockReset();
  mockFindAllByUser.mockReset();
  mockFindById.mockReset();
  mockUpdateBike.mockReset();
  mockDeleteBike.mockReset();
  mockFindAllByUser.mockResolvedValue([]);
});

describe('createBike', () => {
  it('rejects a missing Frame Number with HttpError 400, never touches the repository', async () => {
    const { frameNumber: _frameNumber, ...data } = validBikeData();

    await expect(createBike(USER_ID, data)).rejects.toMatchObject({
      status: 400,
      message: 'Frame Number is required for registration',
    });
    expect(mockCreateBike).not.toHaveBeenCalled();
  });

  it('rejects a missing Model Type with HttpError 400, never touches the repository', async () => {
    const { modelType: _modelType, ...data } = validBikeData();

    await expect(createBike(USER_ID, data)).rejects.toMatchObject({
      status: 400,
      message: 'Model Type is required for registration',
    });
    expect(mockCreateBike).not.toHaveBeenCalled();
  });

  it('rejects a missing Model Year with HttpError 400, never touches the repository', async () => {
    const { modelYear: _modelYear, ...data } = validBikeData();

    await expect(createBike(USER_ID, data)).rejects.toMatchObject({
      status: 400,
      message: 'Model Year is required for registration',
    });
    expect(mockCreateBike).not.toHaveBeenCalled();
  });

  it('does not require Description — accepts a bike without it', async () => {
    const { description: _description, ...data } = validBikeData();
    mockCreateBike.mockResolvedValueOnce({ id: BIKE_ID, ...data });

    await createBike(USER_ID, data);

    expect(mockCreateBike).toHaveBeenCalledWith(USER_ID, data);
  });

  it('rejects a missing specs object with HttpError 400 instead of throwing, never touches the repository', async () => {
    const { specs: _specs, ...data } = validBikeData();

    await expect(createBike(USER_ID, data)).rejects.toMatchObject({ status: 400 });
    expect(mockCreateBike).not.toHaveBeenCalled();
  });

  it.each(['0mm', '18mm', '61mm'])(
    'rejects a Tire Width of %s with HttpError 400, never touches the repository',
    async (tireWidth) => {
      const data = validBikeData({ specs: { ...validBikeData().specs, tireWidth } });

      await expect(createBike(USER_ID, data)).rejects.toMatchObject({
        status: 400,
        message: 'Tire Width must be between 19mm and 60mm',
      });
      expect(mockCreateBike).not.toHaveBeenCalled();
    }
  );

  it.each(['19mm', '60mm'])(
    'accepts a boundary Tire Width of %s and calls the repository',
    async (tireWidth) => {
      const data = validBikeData({ specs: { ...validBikeData().specs, tireWidth } });
      mockCreateBike.mockResolvedValueOnce({ id: BIKE_ID, ...data });

      await createBike(USER_ID, data);

      expect(mockCreateBike).toHaveBeenCalledTimes(1);
      const [, forwardedData] = mockCreateBike.mock.calls[0];
      expect(forwardedData.specs.tireWidth).toBe(tireWidth);
    }
  );

  it('rejects a 4th bike with HttpError 400 when the user already has 3, scoped to that user, never touches the repository', async () => {
    mockFindAllByUser.mockResolvedValueOnce([{ id: '1' }, { id: '2' }, { id: '3' }]);

    await expect(createBike(USER_ID, validBikeData())).rejects.toMatchObject({
      status: 400,
      message: 'You can only track up to 3 bikes',
    });
    expect(mockFindAllByUser).toHaveBeenCalledWith(USER_ID);
    expect(mockCreateBike).not.toHaveBeenCalled();
  });

  it('creates the bike when data is valid and the user has fewer than 3 bikes', async () => {
    const data = validBikeData();
    mockFindAllByUser.mockResolvedValueOnce([{ id: '1' }]);
    mockCreateBike.mockResolvedValueOnce({ id: BIKE_ID, ...data });

    const result = await createBike(USER_ID, data);

    expect(mockCreateBike).toHaveBeenCalledWith(USER_ID, data);
    expect(result).toEqual({ id: BIKE_ID, ...data });
  });
});

describe('listBikes', () => {
  it('delegates to the repository and returns its result unchanged', async () => {
    const bikes = [{ id: BIKE_ID, userId: USER_ID }];
    mockFindAllByUser.mockResolvedValueOnce(bikes);

    const result = await listBikes(USER_ID);

    expect(mockFindAllByUser).toHaveBeenCalledWith(USER_ID);
    expect(result).toEqual(bikes);
  });
});

describe('getBike', () => {
  it('returns the bike when it exists and is owned by the requesting user', async () => {
    const bike = { id: BIKE_ID, userId: USER_ID, modelType: 'Road Bike' };
    mockFindById.mockResolvedValueOnce(bike);

    const result = await getBike(USER_ID, BIKE_ID);

    expect(result).toEqual(bike);
  });

  it('rejects with HttpError 404 when the bike does not exist', async () => {
    mockFindById.mockResolvedValueOnce(null);

    await expect(getBike(USER_ID, BIKE_ID)).rejects.toMatchObject({ status: 404 });
  });

  it('rejects with HttpError 404 when the bike belongs to a different user', async () => {
    mockFindById.mockResolvedValueOnce({ id: BIKE_ID, userId: OTHER_USER_ID });

    await expect(getBike(USER_ID, BIKE_ID)).rejects.toMatchObject({ status: 404 });
  });
});

describe('updateBike', () => {
  const patch = { specs: { tireWidth: '28mm' } };

  it('rejects with HttpError 404 when the bike does not exist, never touches the repository', async () => {
    mockFindById.mockResolvedValueOnce(null);

    await expect(updateBike(USER_ID, BIKE_ID, patch)).rejects.toMatchObject({ status: 404 });
    expect(mockUpdateBike).not.toHaveBeenCalled();
  });

  it('rejects with HttpError 404 when the bike belongs to a different user, never touches the repository', async () => {
    mockFindById.mockResolvedValueOnce({ id: BIKE_ID, userId: OTHER_USER_ID });

    await expect(updateBike(USER_ID, BIKE_ID, patch)).rejects.toMatchObject({ status: 404 });
    expect(mockUpdateBike).not.toHaveBeenCalled();
  });

  it('updates the bike when it exists and is owned by the requesting user', async () => {
    mockFindById.mockResolvedValueOnce({ id: BIKE_ID, userId: USER_ID });
    mockUpdateBike.mockResolvedValueOnce({ id: BIKE_ID, userId: USER_ID, ...patch });

    const result = await updateBike(USER_ID, BIKE_ID, patch);

    expect(mockUpdateBike).toHaveBeenCalledWith(BIKE_ID, patch);
    expect(result).toEqual({ id: BIKE_ID, userId: USER_ID, ...patch });
  });
});

describe('deleteBike', () => {
  it('rejects with HttpError 404 when the bike does not exist, never touches the repository', async () => {
    mockFindById.mockResolvedValueOnce(null);

    await expect(deleteBike(USER_ID, BIKE_ID)).rejects.toMatchObject({ status: 404 });
    expect(mockDeleteBike).not.toHaveBeenCalled();
  });

  it('rejects with HttpError 404 when the bike belongs to a different user, never touches the repository', async () => {
    mockFindById.mockResolvedValueOnce({ id: BIKE_ID, userId: OTHER_USER_ID });

    await expect(deleteBike(USER_ID, BIKE_ID)).rejects.toMatchObject({ status: 404 });
    expect(mockDeleteBike).not.toHaveBeenCalled();
  });

  it('deletes the bike when it exists and is owned by the requesting user', async () => {
    mockFindById.mockResolvedValueOnce({ id: BIKE_ID, userId: USER_ID });

    await deleteBike(USER_ID, BIKE_ID);

    expect(mockDeleteBike).toHaveBeenCalledWith(BIKE_ID);
  });
});
