/**
 * End-to-end advisory test against the live database.
 *
 * Seeds the exact Section 2.4 verification scenario (a farmer, a field planted
 * "Day 0" with Day 1-3 weather, soil report, 92% moisture) directly into the DB,
 * runs the real advisory service, and asserts the computed output matches the
 * expected payload (GDD 39, HIGH Fusarium risk score 100, NPK doses 495/225/135).
 *
 * The Groq AI call is disabled here so the test is deterministic and offline.
 *
 * Run: node tests/advisory.test.js   (requires `npm run db:setup` first)
 */
process.env.GROQ_API_KEY = ''; // force deterministic fallback insights

const assert = require('assert');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/db/pool');
const advisoryService = require('../src/services/advisory.service');

const TEST_EMAIL = 'e2e_test_farmer@example.com';

// "Today" = Day 3. Planting = Day 0 (3 days earlier).
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const dayOffset = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const PLANTING = dayOffset(3); // Day 0
const DAY1 = dayOffset(2);
const DAY2 = dayOffset(1);
const DAY3 = dayOffset(0); // today

async function cleanup() {
  await query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
}

async function setupScenario() {
  await cleanup();

  const cropRes = await query("SELECT id FROM crops WHERE name = 'Watermelon' LIMIT 1");
  assert.ok(cropRes.rows.length, 'Watermelon crop must be seeded (run npm run db:setup)');
  const cropId = cropRes.rows[0].id;

  const hash = await bcrypt.hash('test1234', 10);
  const userRes = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('E2E Farmer', $1, $2, 'farmer') RETURNING id`,
    [TEST_EMAIL, hash]
  );
  const userId = userRes.rows[0].id;

  const fieldRes = await query(
    `INSERT INTO fields (user_id, crop_id, name, season, area_hectare, planting_date)
     VALUES ($1, $2, 'Field A', 'Rabi', 4.5, $3) RETURNING id`,
    [userId, cropId, PLANTING]
  );
  const fieldId = fieldRes.rows[0].id;

  // Exact 3-day weather log (Days 1, 2, 3).
  const weather = [
    [DAY1, 30, 22, 87, 12, 4.0],
    [DAY2, 29, 21, 89, 15, 3.5],
    [DAY3, 28, 20, 86, 8, 3.2],
  ];
  for (const [date, tmax, tmin, rh, rain, et0] of weather) {
    await query(
      `INSERT INTO weather_records (field_id, weather_date, tmax, tmin, humidity, rainfall, et0)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [fieldId, date, tmax, tmin, rh, rain, et0]
    );
  }

  // Soil report: N 120, P 65, K 190, moisture 92%.
  await query(
    `INSERT INTO soil_reports (field_id, report_date, nitrogen, phosphorus, potassium, soil_moisture)
     VALUES ($1,$2,120,65,190,92)`,
    [fieldId, DAY3]
  );

  return { userId, fieldId };
}

async function run() {
  console.log('End-to-end advisory test (Section 2.4 scenario):');
  const { userId, fieldId } = await setupScenario();

  const advisory = await advisoryService.generateAdvisory(fieldId, userId, false);

  // --- Crop stage ---
  assert.strictEqual(advisory.cropStage.gdd, 39, 'GDD should be 39');
  assert.strictEqual(
    advisory.cropStage.stage,
    'Germination & Emergence',
    'stage should be Germination & Emergence'
  );
  assert.strictEqual(advisory.cropStage.daysAfterPlanting, 3, 'DAP should be 3');
  console.log('  ✓ Crop stage: GDD=39, Germination & Emergence, DAP=3');

  // --- Weather summary ---
  assert.strictEqual(advisory.weatherSummary.averageTemperature, 25);
  assert.strictEqual(advisory.weatherSummary.averageHumidity, 87.33);
  assert.strictEqual(advisory.weatherSummary.todaySoilMoisture, 92);
  console.log('  ✓ Weather: avgTemp=25, avgHumidity=87.33, soilMoisture=92');

  // --- Disease risk ---
  const fusarium = advisory.diseaseRisks.find((d) => d.disease === 'Fusarium Wilt');
  assert.ok(fusarium, 'Fusarium Wilt risk must be present');
  assert.strictEqual(fusarium.score, 100);
  assert.strictEqual(fusarium.level, 'HIGH');
  assert.strictEqual(fusarium.advisory, 'Immediate chemical drenching required.');
  assert.ok(fusarium.evaluation.every((e) => e.matched), 'all rules should match');
  console.log('  ✓ Fusarium Wilt: score=100, HIGH, all rules matched');

  // --- Nutrient recommendations ---
  const byName = Object.fromEntries(
    advisory.nutrientRecommendations.map((n) => [n.nutrient, n])
  );
  assert.strictEqual(byName.Nitrogen.status, 'Below Threshold');
  assert.strictEqual(byName.Nitrogen.fieldDoseKg, 495);
  assert.strictEqual(byName.Phosphorus.status, 'Above Threshold');
  assert.strictEqual(byName.Phosphorus.fieldDoseKg, 225);
  assert.strictEqual(byName.Potash.status, 'Above Threshold');
  assert.strictEqual(byName.Potash.fieldDoseKg, 135);
  console.log('  ✓ Nutrients: N=495kg (below), P=225kg (above), K=135kg (above)');

  // --- AI insights present (fallback) ---
  assert.ok(advisory.aiInsights && advisory.aiInsights.summary, 'aiInsights present');
  assert.ok(Array.isArray(advisory.aiInsights.precautions));
  console.log('  ✓ AI insights present (deterministic fallback)');

  await cleanup();
  console.log('\n✓ End-to-end advisory test passed.\n');
}

run()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('\n✗ Test failed:', err.message);
    try {
      await cleanup();
    } catch (_) {}
    await pool.end();
    process.exit(1);
  });
