const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const fieldService = require('./field.service');

function toReport(row) {
  return {
    id: row.id,
    fieldId: row.field_id,
    reportDate: row.report_date ? String(row.report_date).slice(0, 10) : null,
    nitrogen: row.nitrogen != null ? Number(row.nitrogen) : null,
    phosphorus: row.phosphorus != null ? Number(row.phosphorus) : null,
    potassium: row.potassium != null ? Number(row.potassium) : null,
    soilMoisture: row.soil_moisture != null ? Number(row.soil_moisture) : null,
    createdAt: row.created_at,
  };
}

async function createReport(fieldId, userId, data) {
  await fieldService.assertOwnedField(fieldId, userId);
  const reportDate = data.reportDate || new Date().toISOString().slice(0, 10);
  const { rows } = await query(
    `INSERT INTO soil_reports (field_id, report_date, nitrogen, phosphorus, potassium, soil_moisture)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      fieldId,
      reportDate,
      data.nitrogen,
      data.phosphorus,
      data.potassium,
      data.soilMoisture ?? null,
    ]
  );
  return toReport(rows[0]);
}

async function getLatest(fieldId, userId) {
  await fieldService.assertOwnedField(fieldId, userId);
  const { rows } = await query(
    `SELECT * FROM soil_reports WHERE field_id = $1
     ORDER BY report_date DESC, created_at DESC LIMIT 1`,
    [fieldId]
  );
  if (!rows[0]) throw ApiError.notFound('No soil report found for this field');
  return toReport(rows[0]);
}

/** Latest report or null (no throw) — used by the advisory engine. */
async function getLatestOrNull(fieldId) {
  const { rows } = await query(
    `SELECT * FROM soil_reports WHERE field_id = $1
     ORDER BY report_date DESC, created_at DESC LIMIT 1`,
    [fieldId]
  );
  return rows[0] ? toReport(rows[0]) : null;
}

async function getHistory(fieldId, userId) {
  await fieldService.assertOwnedField(fieldId, userId);
  const { rows } = await query(
    `SELECT * FROM soil_reports WHERE field_id = $1
     ORDER BY report_date DESC, created_at DESC`,
    [fieldId]
  );
  return rows.map(toReport);
}

async function deleteReport(reportId, userId) {
  // Ensure the report belongs to a field owned by the user.
  const { rowCount } = await query(
    `DELETE FROM soil_reports sr
     USING fields f
     WHERE sr.id = $1 AND sr.field_id = f.id AND f.user_id = $2`,
    [reportId, userId]
  );
  if (!rowCount) throw ApiError.notFound('Soil report not found');
}

module.exports = {
  toReport,
  createReport,
  getLatest,
  getLatestOrNull,
  getHistory,
  deleteReport,
};
