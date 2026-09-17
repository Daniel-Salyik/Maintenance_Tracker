import { Request, Response } from 'express';
import { getMe, getProfile, getDashboard, updatePreferences } from '../services/user.service';
import { HttpError } from '../utils/http-error';

export async function me(req: Request, res: Response) {
  const data = await getMe(req.userId as string);
  res.status(200).json(data);
}

export async function profile(req: Request, res: Response) {
  const data = await getProfile(req.userId as string);
  res.status(200).json(data);
}

export async function dashboard(req: Request, res: Response) {
  const data = await getDashboard(req.userId as string);
  res.status(200).json(data);
}

export async function updateOwnPreferences(req: Request, res: Response) {
  const data = await updatePreferences(req.userId as string, req.body);
  res.status(200).json(data);
}

export async function updateOtherUserPreferences(req: Request, res: Response) {
  if (req.params.id !== req.userId) {
    throw new HttpError(403, 'Forbidden');
  }
  const data = await updatePreferences(req.userId as string, req.body);
  res.status(200).json(data);
}
