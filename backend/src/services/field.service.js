const { query, withTransaction } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const weatherService = require('./weather.service');

/** Shape a DB row into the API field object. */
function toField(row) {
  return {
    id: row.id,
    name: row.name,
    cropId: row.crop_id,
    crop: row.crop_name,
    season: row.season,
    areaHectare: Number(row.area_hectare),
    plantingDate: row.planting_date
      ? String(row.planting_date).slice(0, 10)
      : null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_FIELD = `
  SELECT f.*, c.name AS crop_name
  FROM fields f
  JOIN crops c ON c.id = f.crop_id
`;

/**
 * Create a field for a user. Also fetches & stores the last 3 days of weather
 * (per the required flow). Runs in a transaction.
 */
async function createField(userId, data) {
  // Confirm crop exists.
  const crop = await query('SELECT id FROM crops WHERE id = $1', [data.cropId]);
  if (!crop.rows.length) throw ApiError.badRequest('cropId does not exist');

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO fields (user_id, crop_id, name, season, area_hectare, planting_date, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        userId,
        data.cropId,
        data.name,
        data.season || null,
        data.areaHectare,
        data.plantingDate,
        data.latitude ?? null,
        data.longitude ?? null,
      ]
    );
    const fieldId = rows[0].id;

    // Fetch + store last 3 days of weather, ending today. Uses the field's
    // coordinates to query Open-Meteo (synthetic fallback if unavailable).
    const today = new Date().toISOString().slice(0, 10);
    await weatherService.syncRecentWeather(client, fieldId, today, 3, {
      latitude: data.latitude,
      longitude: data.longitude,
    });

    const created = await client.query(`${SELECT_FIELD} WHERE f.id = $1`, [fieldId]);
    return toField(created.rows[0]);
  });
}

async function listFields(userId) {
  const { rows } = await query(
    `${SELECT_FIELD} WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows.map(toField);
}

/**
 * Get one field. If `userId` is given, enforce ownership; otherwise (admin)
 * return regardless of owner.
 */
async function getField(fieldId, userId = null) {
  const params = [fieldId];
  let sql = `${SELECT_FIELD} WHERE f.id = $1`;
  if (userId !== null) {
    sql += ' AND f.user_id = $2';
    params.push(userId);
  }
  const { rows } = await query(sql, params);
  if (!rows[0]) throw ApiError.notFound('Field not found');
  return toField(rows[0]);
}

/** Internal: raw field row with ownership check (used by other services). */
async function assertOwnedField(fieldId, userId) {
  const { rows } = await query(
    `${SELECT_FIELD} WHERE f.id = $1 AND f.user_id = $2`,
    [fieldId, userId]
  );
  if (!rows[0]) throw ApiError.notFound('Field not found');
  return rows[0];
}

async function updateField(fieldId, userId, data) {
  const existing = await assertOwnedField(fieldId, userId);

  const map = {
    name: 'name',
    cropId: 'crop_id',
    season: 'season',
    areaHectare: 'area_hectare',
    plantingDate: 'planting_date',
    latitude: 'latitude',
    longitude: 'longitude',
  };
  const sets = [];
  const params = [];
  let i = 1;
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      sets.push(`${col} = $${i++}`);
      params.push(data[key]);
    }
  }
  if (!sets.length) throw ApiError.badRequest('No fields to update');

  // Determine whether the coordinates are actually changing. If so, the stored
  // weather belongs to the old location and must be re-synced.
  const newLat = data.latitude !== undefined ? data.latitude : existing.latitude;
  const newLon = data.longitude !== undefined ? data.longitude : existing.longitude;
  const coordsChanged =
    (data.latitude !== undefined &&
      Number(data.latitude) !== Number(existing.latitude)) ||
    (data.longitude !== undefined &&
      Number(data.longitude) !== Number(existing.longitude));

  await withTransaction(async (client) => {
    params.push(fieldId);
    await client.query(
      `UPDATE fields SET ${sets.join(', ')} WHERE id = $${i}`,
      params
    );

    if (coordsChanged) {
      // Replace the stored weather with the last 3 days for the new location.
      // Clear old records first so a partial (synthetic-fallback) sync can't
      // leave stale rows from the previous coordinates.
      await client.query('DELETE FROM weather_records WHERE field_id = $1', [
        fieldId,
      ]);
      const today = new Date().toISOString().slice(0, 10);
      await weatherService.syncRecentWeather(client, fieldId, today, 3, {
        latitude: newLat,
        longitude: newLon,
      });
    }
  });

  return getField(fieldId, userId);
}

async function deleteField(fieldId, userId) {
  const { rowCount } = await query(
    'DELETE FROM fields WHERE id = $1 AND user_id = $2',
    [fieldId, userId]
  );
  if (!rowCount) throw ApiError.notFound('Field not found');
}

module.exports = {
  toField,
  createField,
  listFields,
  getField,
  assertOwnedField,
  updateField,
  deleteField,
};
