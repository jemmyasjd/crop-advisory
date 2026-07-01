/**
 * Pure engine unit tests — no DB, no network.
 * Verifies the GDD/stage, disease-risk, and nutrient engines against the
 * assignment's required test scenario (Section 2.4).
 *
 * Run: node tests/engines.test.js
 */
const assert = require('assert');
const cropStage = require('../src/engines/cropStage.engine');
const diseaseRisk = require('../src/engines/diseaseRisk.engine');
const nutrient = require('../src/engines/nutrient.engine');

const stages = require('../src/config/datasets/watermelon_stages.json').map((s) => ({
  stage_name: s.stage_name,
  gdd_start: s.gdd_start,
  gdd_end: s.gdd_end,
}));
const risk = require('../src/config/datasets/risk_rules.json');
const nutrients = require('../src/config/datasets/watermelon_nutrients.json');

const TBASE = 12;
const weather = [
  { tmax: 30, tmin: 22, humidity: 87 },
  { tmax: 29, tmin: 21, humidity: 89 },
  { tmax: 28, tmin: 20, humidity: 86 },
];

let passed = 0;
const check = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
};

console.log('Engine tests:');

// --- GDD & stage ---
check('GDD accumulates to 39', () => {
  const gdd = cropStage.accumulateGdd(weather, TBASE);
  assert.strictEqual(gdd, 39);
});
check('Stage resolves to Germination & Emergence', () => {
  const s = cropStage.resolveStage(39, stages);
  assert.strictEqual(s.stage_name, 'Germination & Emergence');
});

// --- Disease risk (build rule rows like the DB would store) ---
const ruleRows = risk.rules.map((r) => ({
  rule_name: r.rule_name,
  parameter: r.parameter,
  operator: r.operator,
  min_value: r.min_value,
  max_value: r.max_value,
  consecutive_days: r.consecutive_days,
  score: r.score,
}));
const levelRows = risk.levels.map((l) => ({
  min_score: l.min_score,
  max_score: l.max_score,
  risk_level: l.risk_level,
  advisory: l.advisory,
}));

check('Average temperature is 25', () => {
  assert.strictEqual(diseaseRisk.averageTemperature(weather), 25);
});
check('Fusarium Wilt score is 100 / HIGH', () => {
  const res = diseaseRisk.computeDiseaseRisk({
    rules: ruleRows,
    levels: levelRows,
    weatherWindow: weather,
    soilMoisture: 92,
    diseaseName: 'Fusarium Wilt',
  });
  assert.strictEqual(res.score, 100);
  assert.strictEqual(res.level, 'HIGH');
  assert.strictEqual(res.advisory, 'Immediate chemical drenching required.');
  assert.ok(res.evaluation.every((e) => e.matched));
});

// --- Nutrient recommendations ---
const nutrientRules = nutrients.map((n) => ({
  nutrient: n.nutrient,
  fertilizer: n.fertilizer,
  soil_threshold: n.Soil_availability_NPK_threshold,
  dose_under_threshold: n.dose_under_threshold_kg_ha,
  dose_above_threshold: n.dose_above_threshold_kg_ha,
}));
const soilReport = { nitrogen: 120, phosphorus: 65, potassium: 190 };

check('Nutrient doses scale correctly for 4.5 ha', () => {
  const recs = nutrient.recommendNutrients({
    nutrientRules,
    soilReport,
    areaHectare: 4.5,
  });
  const byName = Object.fromEntries(recs.map((r) => [r.nutrient, r]));

  // Nitrogen 120 < 150 -> under-threshold 110 * 4.5 = 495
  assert.strictEqual(byName.Nitrogen.status, 'Below Threshold');
  assert.strictEqual(byName.Nitrogen.dosePerHectareKg, 110);
  assert.strictEqual(byName.Nitrogen.fieldDoseKg, 495);

  // Phosphorus 65 >= 50 -> above-threshold 50 * 4.5 = 225
  assert.strictEqual(byName.Phosphorus.status, 'Above Threshold');
  assert.strictEqual(byName.Phosphorus.dosePerHectareKg, 50);
  assert.strictEqual(byName.Phosphorus.fieldDoseKg, 225);

  // Potash 190 >= 180 -> above-threshold 30 * 4.5 = 135
  assert.strictEqual(byName.Potash.status, 'Above Threshold');
  assert.strictEqual(byName.Potash.dosePerHectareKg, 30);
  assert.strictEqual(byName.Potash.fieldDoseKg, 135);
});

console.log(`\n✓ All ${passed} engine assertions passed.\n`);
