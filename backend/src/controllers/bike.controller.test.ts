import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

const {
  mockCreateBike,
  mockListBikes,
  mockGetBike,
  mockUpdateBike,
  mockDeleteBike,
} = vi.hoisted(() => ({
  mockCreateBike: vi.fn(),
  mockListBikes: vi.fn(),
  mockGetBike: vi.fn(),
  mockUpdateBike: vi.fn(),
  mockDeleteBike: vi.fn(),
}));

vi.mock('../services/bike.service', () => ({
  createBike: mockCreateBike,
  listBikes: mockListBikes,
  getBike: mockGetBike,
  updateBike: mockUpdateBike,
  deleteBike: mockDeleteBike,
}));

import { create, list, get, update, remove } from './bike.controller';

const USER_ID = 'user-1';
const BIKE_ID = 'bike-1';

beforeEach(() => {
  mockCreateBike.mockReset();
  mockListBikes.mockReset();
  mockGetBike.mockReset();
  mockUpdateBike.mockReset();
  mockDeleteBike.mockReset();
});

function fakeRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

describe('create', () => {
  it('delegates to the service and responds 201 with the created bike', async () => {
    const bike = { id: BIKE_ID, userId: USER_ID };
    mockCreateBike.mockResolvedValueOnce(bike);
    const req = { userId: USER_ID, body: { modelType: 'Road Bike' } } as unknown as Request;
    const res = fakeRes();

    await create(req, res);

    expect(mockCreateBike).toHaveBeenCalledWith(USER_ID, req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(bike);
  });
});

describe('list', () => {
  it('delegates to the service and responds 200 with the bikes', async () => {
    const bikes = [{ id: BIKE_ID, userId: USER_ID }];
    mockListBikes.mockResolvedValueOnce(bikes);
    const req = { userId: USER_ID } as unknown as Request;
    const res = fakeRes();

    await list(req, res);

    expect(mockListBikes).toHaveBeenCalledWith(USER_ID);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(bikes);
  });
});

describe('get', () => {
  it('delegates to the service with the id param and responds 200', async () => {
    const bike = { id: BIKE_ID, userId: USER_ID };
    mockGetBike.mockResolvedValueOnce(bike);
    const req = { userId: USER_ID, params: { id: BIKE_ID } } as unknown as Request;
    const res = fakeRes();

    await get(req, res);

    expect(mockGetBike).toHaveBeenCalledWith(USER_ID, BIKE_ID);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(bike);
  });

  it('propagates a rejection from the service instead of responding', async () => {
    mockGetBike.mockRejectedValueOnce({ status: 404 });
    const req = { userId: USER_ID, params: { id: 'missing' } } as unknown as Request;
    const res = fakeRes();

    await expect(get(req, res)).rejects.toMatchObject({ status: 404 });
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('update', () => {
  it('delegates to the service with the id param and body, responds 200', async () => {
    const bike = { id: BIKE_ID, userId: USER_ID, description: 'Updated' };
    mockUpdateBike.mockResolvedValueOnce(bike);
    const req = { userId: USER_ID, params: { id: BIKE_ID }, body: { description: 'Updated' } } as unknown as Request;
    const res = fakeRes();

    await update(req, res);

    expect(mockUpdateBike).toHaveBeenCalledWith(USER_ID, BIKE_ID, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(bike);
  });
});

describe('remove', () => {
  it('delegates to the service with the id param and responds 204 with no body', async () => {
    mockDeleteBike.mockResolvedValueOnce(undefined);
    const req = { userId: USER_ID, params: { id: BIKE_ID } } as unknown as Request;
    const res = fakeRes();

    await remove(req, res);

    expect(mockDeleteBike).toHaveBeenCalledWith(USER_ID, BIKE_ID);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
