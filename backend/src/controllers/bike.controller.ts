import { Request, Response } from 'express';
import { createBike, listBikes, getBike, updateBike, deleteBike } from '../services/bike.service';

export async function create(req: Request, res: Response) {
  const bike = await createBike(req.userId as string, req.body);
  res.status(201).json(bike);
}

export async function list(req: Request, res: Response) {
  const bikes = await listBikes(req.userId as string);
  res.status(200).json(bikes);
}

export async function get(req: Request, res: Response) {
  const bike = await getBike(req.userId as string, req.params.id as string);
  res.status(200).json(bike);
}

export async function update(req: Request, res: Response) {
  const bike = await updateBike(req.userId as string, req.params.id as string, req.body);
  res.status(200).json(bike);
}

export async function remove(req: Request, res: Response) {
  await deleteBike(req.userId as string, req.params.id as string);
  res.status(204).send();
}
