const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');

const r = (rows) => rows;

/** Generic update helper: builds SET clause from a body->column map. */
async function updateRow(table, id, body, map, returning = '*') {
  const sets = [];
  const params = [];
  let i = 1;
  for (const [key, col] of Object.entries(map)) {
    if (body[key] !== undefined) {
      sets.push(`${col} = $${i++}`);
      params.push(body[key]);
    }
  }
  if (!sets.length) throw ApiError.badRequest('No fields to update');
  params.push(id);
  const { rows } = await query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${returning}`,
    params
  );
  if (!rows[0]) throw ApiError.notFound(`${table} record not found`);
  return rows[0];
}

async function deleteRow(table, id) {
  const { rowCount } = await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  if (!rowCount) throw ApiError.notFound(`${table} record not found`);
}

// =========================== Dashboard ===========================
async function dashboard() {
  const [farmers, fields, advisories, crops, weather] = await Promise.all([
    query("SELECT COUNT(*)::int AS c FROM users WHERE role = 'farmer'"),
    query('SELECT COUNT(*)::int AS c FROM fields'),
    query('SELECT COUNT(*)::int AS c FROM advisories'),
    query('SELECT COUNT(*)::int AS c FROM crops'),
    query('SELECT MAX(created_at) AS last FROM weather_records'),
  ]);
  const lastSync = weather.rows[0].last;
  return {
    totalFarmers: farmers.rows[0].c,
    totalFields: fields.rows[0].c,
    totalAdvisories: advisories.rows[0].c,
    activeCrops: crops.rows[0].c,
    weatherSyncStatus: {
      lastSyncedAt: lastSync,
      status: lastSync ? 'OK' : 'NO_DATA',
    },
  };
}

// =========================== Crops ===========================
async function listCrops() {
  const { rows } = await query('SELECT * FROM crops ORDER BY id ASC');
  return r(rows);
}
async function createCrop({ name, baseTemperature }) {
  const { rows } = await query(
    'INSERT INTO crops (name, base_temperature) VALUES ($1,$2) RETURNING *',
    [name, baseTemperature]
  );
  return rows[0];
}
const updateCrop = (id, body) =>
  updateRow('crops', id, body, { name: 'name', baseTemperature: 'base_temperature' });
const deleteCrop = (id) => deleteRow('crops', id);

// =========================== Stages ===========================
async function listStages() {
  const { rows } = await query(
    'SELECT * FROM crop_stages ORDER BY crop_id ASC, gdd_start ASC'
  );
  return r(rows);
}
async function createStage(b) {
  const { rows } = await query(
    `INSERT INTO crop_stages (crop_id, stage_name, gdd_start, gdd_end, sort_order)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [b.cropId, b.stageName, b.gddStart, b.gddEnd, b.sortOrder ?? 0]
  );
  return rows[0];
}
const updateStage = (id, body) =>
  updateRow('crop_stages', id, body, {
    stageName: 'stage_name',
    gddStart: 'gdd_start',
    gddEnd: 'gdd_end',
    sortOrder: 'sort_order',
  });
const deleteStage = (id) => deleteRow('crop_stages', id);

// =========================== Diseases ===========================
async function listDiseases() {
  const { rows } = await query('SELECT * FROM diseases ORDER BY id ASC');
  return r(rows);
}
async function createDisease(b) {
  const { rows } = await query(
    'INSERT INTO diseases (crop_id, disease_name, description) VALUES ($1,$2,$3) RETURNING *',
    [b.cropId, b.diseaseName, b.description ?? null]
  );
  return rows[0];
}
const updateDisease = (id, body) =>
  updateRow('diseases', id, body, {
    diseaseName: 'disease_name',
    description: 'description',
  });
const deleteDisease = (id) => deleteRow('diseases', id);

// =========================== Disease rules ===========================
async function listDiseaseRules() {
  const { rows } = await query(
    'SELECT * FROM disease_risk_rules ORDER BY disease_id ASC, id ASC'
  );
  return r(rows);
}
async function createDiseaseRule(b) {
  const { rows } = await query(
    `INSERT INTO disease_risk_rules
       (disease_id, rule_name, parameter, operator, min_value, max_value, consecutive_days, score)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      b.diseaseId,
      b.ruleName ?? b.parameter,
      b.parameter,
      b.operator,
      b.minValue ?? null,
      b.maxValue ?? null,
      b.consecutiveDays ?? null,
      b.score,
    ]
  );
  return rows[0];
}
const updateDiseaseRule = (id, body) =>
  updateRow('disease_risk_rules', id, body, {
    ruleName: 'rule_name',
    parameter: 'parameter',
    operator: 'operator',
    minValue: 'min_value',
    maxValue: 'max_value',
    consecutiveDays: 'consecutive_days',
    score: 'score',
  });
const deleteDiseaseRule = (id) => deleteRow('disease_risk_rules', id);

// =========================== Risk levels ===========================
async function listRiskLevels() {
  const { rows } = await query(
    'SELECT * FROM disease_risk_levels ORDER BY disease_id ASC, min_score ASC'
  );
  return r(rows);
}
async function createRiskLevel(b) {
  const { rows } = await query(
    `INSERT INTO disease_risk_levels (disease_id, min_score, max_score, risk_level, advisory)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [b.diseaseId, b.minScore, b.maxScore, b.riskLevel, b.advisory]
  );
  return rows[0];
}
const updateRiskLevel = (id, body) =>
  updateRow('disease_risk_levels', id, body, {
    minScore: 'min_score',
    maxScore: 'max_score',
    riskLevel: 'risk_level',
    advisory: 'advisory',
  });
const deleteRiskLevel = (id) => deleteRow('disease_risk_levels', id);

// =========================== Nutrient rules ===========================
async function listNutrientRules() {
  const { rows } = await query(
    'SELECT * FROM nutrient_rules ORDER BY crop_id ASC, stage_id ASC, id ASC'
  );
  return r(rows);
}
async function createNutrientRule(b) {
  const { rows } = await query(
    `INSERT INTO nutrient_rules
       (crop_id, stage_id, season, nutrient, fertilizer, soil_threshold, dose_under_threshold, dose_above_threshold)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      b.cropId,
      b.stageId,
      b.season ?? null,
      b.nutrient,
      b.fertilizer,
      b.soilThreshold,
      b.doseUnderThreshold,
      b.doseAboveThreshold,
    ]
  );
  return rows[0];
}
const updateNutrientRule = (id, body) =>
  updateRow('nutrient_rules', id, body, {
    stageId: 'stage_id',
    season: 'season',
    nutrient: 'nutrient',
    fertilizer: 'fertilizer',
    soilThreshold: 'soil_threshold',
    doseUnderThreshold: 'dose_under_threshold',
    doseAboveThreshold: 'dose_above_threshold',
  });
const deleteNutrientRule = (id) => deleteRow('nutrient_rules', id);

// =========================== Farmers ===========================
async function listFarmers() {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.created_at,
            COUNT(f.id)::int AS field_count
     FROM users u
     LEFT JOIN fields f ON f.user_id = u.id
     WHERE u.role = 'farmer'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return rows;
}
async function getFarmer(id) {
  const { rows } = await query(
    `SELECT id, name, email, phone, role, created_at, updated_at
     FROM users WHERE id = $1 AND role = 'farmer'`,
    [id]
  );
  if (!rows[0]) throw ApiError.notFound('Farmer not found');
  const fields = await query(
    `SELECT f.id, f.name, c.name AS crop, f.season, f.area_hectare, f.planting_date
     FROM fields f JOIN crops c ON c.id = f.crop_id
     WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
    [id]
  );
  return { ...rows[0], fields: fields.rows };
}
async function deleteFarmer(id) {
  const { rowCount } = await query(
    "DELETE FROM users WHERE id = $1 AND role = 'farmer'",
    [id]
  );
  if (!rowCount) throw ApiError.notFound('Farmer not found');
}

// =========================== Fields (admin view) ===========================
async function listAllFields() {
  const { rows } = await query(
    `SELECT f.id, f.name, f.season, f.area_hectare, f.planting_date,
            c.name AS crop, u.id AS farmer_id, u.name AS farmer_name
     FROM fields f
     JOIN crops c ON c.id = f.crop_id
     JOIN users u ON u.id = f.user_id
     ORDER BY f.created_at DESC`
  );
  return rows;
}
async function getFieldDetails(id) {
  const { rows } = await query(
    `SELECT f.*, c.name AS crop, u.name AS farmer_name, u.email AS farmer_email
     FROM fields f
     JOIN crops c ON c.id = f.crop_id
     JOIN users u ON u.id = f.user_id
     WHERE f.id = $1`,
    [id]
  );
  if (!rows[0]) throw ApiError.notFound('Field not found');
  return rows[0];
}
async function deleteFieldAdmin(id) {
  const { rowCount } = await query('DELETE FROM fields WHERE id = $1', [id]);
  if (!rowCount) throw ApiError.notFound('Field not found');
}

module.exports = {
  dashboard,
  listCrops, createCrop, updateCrop, deleteCrop,
  listStages, createStage, updateStage, deleteStage,
  listDiseases, createDisease, updateDisease, deleteDisease,
  listDiseaseRules, createDiseaseRule, updateDiseaseRule, deleteDiseaseRule,
  listRiskLevels, createRiskLevel, updateRiskLevel, deleteRiskLevel,
  listNutrientRules, createNutrientRule, updateNutrientRule, deleteNutrientRule,
  listFarmers, getFarmer, deleteFarmer,
  listAllFields, getFieldDetails, deleteFieldAdmin,
};
