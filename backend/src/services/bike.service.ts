import * as bikeRepository from '../repositories/bike.repository';
import { HttpError } from '../utils/http-error';

const REQUIRED_FIELDS: Record<string, string> = {
  frameNumber: 'Frame Number',
  modelType: 'Model Type',
  modelYear: 'Model Year',
};

const MAX_BIKES = 3;

function assertOwned<T extends { userId: string } | null>(
  bike: T,
  userId: string
): asserts bike is NonNullable<T> {
  if (!bike || bike.userId !== userId) {
    throw new HttpError(404, 'Bike not found');
  }
}

export async function createBike(userId: string, data: any) {
  for (const [field, label] of Object.entries(REQUIRED_FIELDS)) {
    if (!data[field]) {
      throw new HttpError(400, `${label} is required for registration`);
    }
  }

  if (!data.specs) {
    throw new HttpError(400, 'Specifications are required');
  }

  const tireWidth = parseInt(data.specs.tireWidth, 10);
  if (Number.isNaN(tireWidth) || tireWidth < 19 || tireWidth > 60) {
    throw new HttpError(400, 'Tire Width must be between 19mm and 60mm');
  }

  const existingBikes = await bikeRepository.findAllByUser(userId);
  if (existingBikes.length >= MAX_BIKES) {
    throw new HttpError(400, 'You can only track up to 3 bikes');
  }

  return bikeRepository.createBike(userId, data);
}

export async function listBikes(userId: string) {
  return bikeRepository.findAllByUser(userId);
}

export async function getBike(userId: string, bikeId: string) {
  const bike = await bikeRepository.findById(bikeId);
  assertOwned(bike, userId);
  return bike;
}

export async function updateBike(userId: string, bikeId: string, patch: Record<string, any>) {
  const bike = await bikeRepository.findById(bikeId);
  assertOwned(bike, userId);

  const mergedPatch = patch.specs
    ? { ...patch, specs: { ...(bike.specs ?? {}), ...patch.specs } }
    : patch;

  return bikeRepository.updateBike(bikeId, mergedPatch);
}

export async function deleteBike(userId: string, bikeId: string) {
  const bike = await bikeRepository.findById(bikeId);
  assertOwned(bike, userId);
  return bikeRepository.deleteBike(bikeId);
}
