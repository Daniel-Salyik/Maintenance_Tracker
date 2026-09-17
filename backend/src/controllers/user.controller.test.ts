import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

const { mockUpdatePreferences } = vi.hoisted(() => ({
  mockUpdatePreferences: vi.fn(),
}));

vi.mock('../services/user.service', () => ({
  updatePreferences: mockUpdatePreferences,
}));

import { updateOtherUserPreferences } from './user.controller';

beforeEach(() => {
  mockUpdatePreferences.mockReset();
});

function fakeRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('updateOtherUserPreferences', () => {
  it('rejects with HttpError 403 when the target id is not the caller, never calls the service', async () => {
    const req = { params: { id: 'userA' }, userId: 'userB', body: { currency: 'GBP' } } as unknown as Request;
    const res = fakeRes();

    await expect(updateOtherUserPreferences(req, res)).rejects.toMatchObject({ status: 403 });

    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  it('delegates to the service when the target id matches the caller', async () => {
    mockUpdatePreferences.mockResolvedValueOnce({ id: 'userA', currency: 'GBP' });
    const req = { params: { id: 'userA' }, userId: 'userA', body: { currency: 'GBP' } } as unknown as Request;
    const res = fakeRes();

    await updateOtherUserPreferences(req, res);

    expect(mockUpdatePreferences).toHaveBeenCalledWith('userA', { currency: 'GBP' });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
