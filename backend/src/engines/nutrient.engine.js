/**
 * Soil-Based Nutrient Recommender
 * -------------------------------
 * For the current growth stage, compares the latest soil report against the
 * configured nutrient thresholds and returns N/P/K fertilizer dosages scaled to
 * the field's size.
 *
 * Logic (per nutrient rule for the stage):
 *   1. Read the soil value for the nutrient (N / P / K).
 *   2. If soil value < threshold  -> use dose_under_threshold (deficient).
 *      If soil value >= threshold -> use dose_above_threshold (sufficient).
 *   3. fieldDose = dosePerHectare * fieldAreaHectare.
 *
 * If no soil report exists, fall back to the stage default (under-threshold
 * dose), since we cannot confirm sufficiency.
 */

/** Round to 2 decimals. */
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Map a nutrient rule's `nutrient` field to the matching soil-report value.
 * Handles "Potash"/"Potassium" naming difference between dataset and report.
 */
function soilValueFor(nutrient, soilReport) {
  if (!soilReport) return null;
  const key = String(nutrient).toLowerCase();
  if (key.startsWith('nitro')) return numOrNull(soilReport.nitrogen);
  if (key.startsWith('phos')) return numOrNull(soilReport.phosphorus);
  if (key.startsWith('pot')) return numOrNull(soilReport.potassium); // Potash / Potassium
  return null;
}

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * Build a single nutrient recommendation from one nutrient rule.
 * @param {object} rule        - nutrient_rules row
 * @param {object|null} soilReport
 * @param {number} areaHectare
 */
function recommendForRule(rule, soilReport, areaHectare) {
  const threshold = Number(rule.soil_threshold);
  const soilValue = soilValueFor(rule.nutrient, soilReport);

  let dosePerHectare;
  let status;

  if (soilValue === null) {
    // No measurement -> assume deficient, apply the under-threshold dose.
    dosePerHectare = Number(rule.dose_under_threshold);
    status = 'No Soil Data (Default)';
  } else if (soilValue < threshold) {
    dosePerHectare = Number(rule.dose_under_threshold);
    status = 'Below Threshold';
  } else {
    dosePerHectare = Number(rule.dose_above_threshold);
    status = 'Above Threshold';
  }

  return {
    nutrient: rule.nutrient,
    soilValue,
    threshold,
    status,
    fertilizer: rule.fertilizer,
    dosePerHectareKg: r2(dosePerHectare),
    fieldDoseKg: r2(dosePerHectare * Number(areaHectare)),
  };
}

/**
 * Produce nutrient recommendations for the current stage.
 * @param {object} params
 * @param {Array}  params.nutrientRules - nutrient_rules rows for crop+stage
 * @param {object|null} params.soilReport - latest soil report (or null)
 * @param {number} params.areaHectare
 * @param {boolean} params.personalized - true if a soil report drove the result
 * @returns {Array} recommendations
 */
function recommendNutrients({ nutrientRules, soilReport, areaHectare }) {
  return nutrientRules.map((rule) =>
    recommendForRule(rule, soilReport, areaHectare)
  );
}

module.exports = {
  soilValueFor,
  recommendForRule,
  recommendNutrients,
};
