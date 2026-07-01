const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');

const cropStageEngine = require('../engines/cropStage.engine');
const diseaseRiskEngine = require('../engines/diseaseRisk.engine');
const nutrientEngine = require('../engines/nutrient.engine');

const fieldService = require('./field.service');
const soilService = require('./soilReport.service');
const weatherService = require('./weather.service');
const groq = require('../utils/groqClient');

const r2 = (n) => Math.round(n * 100) / 100;

/** Load all reference data needed to compute an advisory for a field. */
async function loadContext(fieldRow) {
  const cropId = fieldRow.cropId;

  const [crop, stages, diseases] = await Promise.all([
    query('SELECT id, name, base_temperature FROM crops WHERE id = $1', [cropId]),
    query(
      'SELECT id, stage_name, gdd_start, gdd_end FROM crop_stages WHERE crop_id = $1 ORDER BY gdd_start ASC',
      [cropId]
    ),
    query('SELECT id, disease_name FROM diseases WHERE crop_id = $1', [cropId]),
  ]);

  if (!crop.rows.length) throw ApiError.badRequest('Crop not configured');

  return {
    crop: crop.rows[0],
    stages: stages.rows,
    diseases: diseases.rows,
  };
}

/** Build weatherSummary block used in the response. */
function buildWeatherSummary(window, soilMoisture) {
  const avgTemp = diseaseRiskEngine.averageTemperature(window);
  const avgHumidity = window.length
    ? r2(
        window.reduce((s, d) => s + Number(d.humidity), 0) / window.length
      )
    : null;
  return {
    daysConsidered: window.length,
    averageTemperature: avgTemp,
    averageHumidity: avgHumidity,
    todaySoilMoisture: soilMoisture,
  };
}

/**
 * Generate a full advisory for a field.
 * @param {number} fieldId
 * @param {number|null} userId - if provided, enforce ownership
 * @param {boolean} persist - store a snapshot into `advisories`
 */
async function generateAdvisory(fieldId, userId = null, persist = true) {
  const field = await fieldService.getField(fieldId, userId);
  const ctx = await loadContext(field);

  // --- Weather since planting (for GDD) and last 3 days (for risk) ---
  const sincePlanting = await weatherService.getWeatherSincePlanting(
    fieldId,
    field.plantingDate
  );
  const last3 = await weatherService.getRecentWeather(fieldId, 3);

  // --- Crop stage via GDD ---
  const today = new Date().toISOString().slice(0, 10);
  const tBase = Number(ctx.crop.base_temperature);
  const { gdd, stage, daysAfterPlanting } = cropStageEngine.computeCropStage({
    weatherDays: sincePlanting,
    tBase,
    stages: ctx.stages,
    plantingDate: field.plantingDate,
    today,
  });
  if (!stage) throw ApiError.badRequest('Could not resolve crop stage');

  // --- Latest soil report ---
  const soilReport = await soilService.getLatestOrNull(fieldId);
  const soilMoisture = soilReport ? soilReport.soilMoisture : null;

  // --- Disease risks ---
  const diseaseRisks = [];
  for (const disease of ctx.diseases) {
    const [rules, levels] = await Promise.all([
      query(
        `SELECT rule_name, parameter, operator, min_value, max_value, consecutive_days, score
         FROM disease_risk_rules WHERE disease_id = $1`,
        [disease.id]
      ),
      query(
        `SELECT min_score, max_score, risk_level, advisory
         FROM disease_risk_levels WHERE disease_id = $1 ORDER BY min_score ASC`,
        [disease.id]
      ),
    ]);
    if (!rules.rows.length || !levels.rows.length) continue;

    diseaseRisks.push(
      diseaseRiskEngine.computeDiseaseRisk({
        rules: rules.rows,
        levels: levels.rows,
        weatherWindow: last3,
        soilMoisture,
        diseaseName: disease.disease_name,
      })
    );
  }

  // --- Nutrient recommendations for the current stage ---
  const stageRow = ctx.stages.find((s) => s.stage_name === stage.stage_name);

  // Prefer rules matching the field's season; fall back to season-agnostic rules
  // (or any season) if none exist for that season. This makes the season choice
  // affect recommendations while staying compatible with the Rabi-only dataset.
  let nutrientRules = { rows: [] };
  if (field.season) {
    nutrientRules = await query(
      `SELECT nutrient, fertilizer, soil_threshold, dose_under_threshold, dose_above_threshold
       FROM nutrient_rules
       WHERE crop_id = $1 AND stage_id = $2 AND season = $3
       ORDER BY id ASC`,
      [ctx.crop.id, stageRow.id, field.season]
    );
  }
  if (!nutrientRules.rows.length) {
    nutrientRules = await query(
      `SELECT nutrient, fertilizer, soil_threshold, dose_under_threshold, dose_above_threshold
       FROM nutrient_rules
       WHERE crop_id = $1 AND stage_id = $2
       ORDER BY id ASC`,
      [ctx.crop.id, stageRow.id]
    );
  }
  const nutrientRecommendations = nutrientEngine.recommendNutrients({
    nutrientRules: nutrientRules.rows,
    soilReport,
    areaHectare: field.areaHectare,
  });

  // --- Assemble advisory (without AI yet) ---
  const advisory = {
    field: {
      id: field.id,
      name: field.name,
      crop: field.crop,
      season: field.season,
      areaHectare: field.areaHectare,
      plantingDate: field.plantingDate,
    },
    cropStage: {
      gdd,
      stage: stage.stage_name,
      daysAfterPlanting,
    },
    weatherSummary: buildWeatherSummary(last3, soilMoisture),
    diseaseRisks,
    nutrientRecommendations,
    personalized: Boolean(soilReport),
  };

  // --- AI insights (fails soft to rule-based fallback) ---
  advisory.aiInsights = await groq.generateInsights(advisory);

  // --- Persist snapshot ---
  if (persist) {
    await query(
      `INSERT INTO advisories (field_id, gdd, stage_name, payload)
       VALUES ($1, $2, $3, $4)`,
      [fieldId, gdd, stage.stage_name, advisory]
    );
  }

  return advisory;
}

/** Advisory history for a field. */
async function getAdvisoryHistory(fieldId, userId) {
  await fieldService.getField(fieldId, userId); // ownership check
  const { rows } = await query(
    `SELECT id, generated_at, gdd, stage_name, payload
     FROM advisories WHERE field_id = $1 ORDER BY generated_at DESC`,
    [fieldId]
  );
  return rows.map((r) => ({
    id: r.id,
    generatedAt: r.generated_at,
    gdd: Number(r.gdd),
    stage: r.stage_name,
    advisory: r.payload,
  }));
}

/** Delete a stored advisory, enforcing that it belongs to the user's field. */
async function deleteAdvisory(fieldId, advisoryId, userId) {
  await fieldService.getField(fieldId, userId); // ownership check (throws 404)
  const { rowCount } = await query(
    'DELETE FROM advisories WHERE id = $1 AND field_id = $2',
    [advisoryId, fieldId]
  );
  if (!rowCount) throw ApiError.notFound('Advisory not found');
}

module.exports = {
  generateAdvisory,
  getAdvisoryHistory,
  deleteAdvisory,
  buildWeatherSummary,
};
