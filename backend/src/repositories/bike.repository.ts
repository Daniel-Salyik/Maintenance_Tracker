import { pool } from '../config/db';

export async function createBike(userId: string, data: any) {
  const { rows } = await pool.query(
    `INSERT INTO bikes (user_id, name, frame_number, model_type, model_year, description, specs)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      data.name,
      data.frameNumber,
      data.modelType,
      data.modelYear,
      data.description ?? null,
      data.specs ?? {},
    ]
  );
  return rows[0];
}

export async function findAllByUser(userId: string) {
  const { rows } = await pool.query('SELECT * FROM bikes WHERE user_id = $1', [userId]);
  return rows;
}

export async function findById(bikeId: string) {
  const { rows } = await pool.query('SELECT * FROM bikes WHERE id = $1', [bikeId]);
  return rows[0] ?? null;
}

export async function updateBike(bikeId: string, patch: Record<string, any>) {
  const columns = Object.keys(patch);
  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
  const params = [...columns.map((col) => patch[col]), bikeId];

  const { rows } = await pool.query(
    `UPDATE bikes SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *`,
    params
  );
  return rows[0];
}

export async function deleteBike(bikeId: string) {
  await pool.query('DELETE FROM bikes WHERE id = $1', [bikeId]);
}
