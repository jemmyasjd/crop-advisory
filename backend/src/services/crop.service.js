const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');

function toCrop(r) {
  return {
    id: r.id,
    name: r.name,
    baseTemperature: Number(r.base_temperature),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
function toStage(r) {
  return {
    id: r.id,
    cropId: r.crop_id,
    stageName: r.stage_name,
    gddStart: r.gdd_start,
    gddEnd: r.gdd_end,
    sortOrder: r.sort_order,
  };
}
function toDisease(r) {
  return {
    id: r.id,
    cropId: r.crop_id,
    diseaseName: r.disease_name,
    description: r.description,
  };
}

async function listCrops() {
  const { rows } = await query('SELECT * FROM crops ORDER BY id ASC');
  return rows.map(toCrop);
}

async function getStages(cropId) {
  const crop = await query('SELECT id FROM crops WHERE id = $1', [cropId]);
  if (!crop.rows.length) throw ApiError.notFound('Crop not found');
  const { rows } = await query(
    'SELECT * FROM crop_stages WHERE crop_id = $1 ORDER BY gdd_start ASC',
    [cropId]
  );
  return rows.map(toStage);
}

async function getDiseases(cropId) {
  const crop = await query('SELECT id FROM crops WHERE id = $1', [cropId]);
  if (!crop.rows.length) throw ApiError.notFound('Crop not found');
  const { rows } = await query(
    'SELECT * FROM diseases WHERE crop_id = $1 ORDER BY id ASC',
    [cropId]
  );
  return rows.map(toDisease);
}

module.exports = { toCrop, toStage, toDisease, listCrops, getStages, getDiseases };
