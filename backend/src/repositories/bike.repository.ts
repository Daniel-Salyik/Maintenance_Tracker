import { pool } from '../config/db';

const COLUMN_MAP: Record<string, string> = {
  name: 'name',
  frameNumber: 'frame_number',
  modelType: 'model_type',
  modelYear: 'model_year',
  description: 'description',
  specs: 'specs',
};

function mapRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    frameNumber: row.frame_number,
    modelType: row.model_type,
    modelYear: row.model_year,
    description: row.description,
    specs: row.specs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createBike(userId: string, data: any) {
  const { rows } = await pool.query(
    `INSERT INTO bikes (user_id, name, frame_number, model_type, model_year, description, specs)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      data.name ?? null,
      data.frameNumber,
      data.modelType,
      data.modelYear,
      data.description ?? null,
      data.specs ?? {},
    ]
  );
  return mapRow(rows[0]);
}

export async function findAllByUser(userId: string) {
  const { rows } = await pool.query('SELECT * FROM bikes WHERE user_id = $1', [userId]);
  return rows.map(mapRow);
}

export async function findById(bikeId: string) {
  const { rows } = await pool.query('SELECT * FROM bikes WHERE id = $1', [bikeId]);
  return mapRow(rows[0]);
}

export async function updateBike(bikeId: string, patch: Record<string, any>) {
  const keys = Object.keys(patch);
  const columns = keys.map((key) => {
    const column = COLUMN_MAP[key];
    if (!column) {
      throw new Error(`Cannot update column: ${key}`);
    }
    return column;
  });

  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
  const params = [...keys.map((key) => patch[key]), bikeId];

  const { rows } = await pool.query(
    `UPDATE bikes SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *`,
    params
  );
  return mapRow(rows[0]);
}

export async function deleteBike(bikeId: string) {
  await pool.query('DELETE FROM bikes WHERE id = $1', [bikeId]);
}
