/**
 * Seeds reference data (crop, stages, disease + rules + levels, nutrient rules)
 * and a bootstrap admin user from the JSON datasets in src/config/datasets.
 *
 * Idempotent: clears the seeded tables first, then re-inserts.
 * Usage: npm run seed
 */
const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('./pool');
const config = require('../config');

const stages = require('../config/datasets/watermelon_stages.json');
const riskRules = require('../config/datasets/risk_rules.json');
const nutrients = require('../config/datasets/watermelon_nutrients.json');

async function seed() {
  await withTransaction(async (client) => {
    // --- Reset reference tables (keep users/fields data intact except admin) ---
    await client.query(
      'TRUNCATE nutrient_rules, disease_risk_levels, disease_risk_rules, diseases, crop_stages, crops RESTART IDENTITY CASCADE'
    );

    // --- 1. Crop: Watermelon (Tbase = 12) ---
    const cropRes = await client.query(
      'INSERT INTO crops (name, base_temperature) VALUES ($1, $2) RETURNING id',
      ['Watermelon', 12]
    );
    const cropId = cropRes.rows[0].id;
    console.log(`✓ Crop created: Watermelon (id=${cropId})`);

    // --- 2. Crop stages ---
    const stageIdByName = {};
    for (const s of stages) {
      const res = await client.query(
        `INSERT INTO crop_stages (crop_id, stage_name, gdd_start, gdd_end, sort_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [cropId, s.stage_name, s.gdd_start, s.gdd_end, s.stage_id]
      );
      stageIdByName[s.stage_name] = res.rows[0].id;
    }
    console.log(`✓ ${stages.length} crop stages created`);

    // --- 3. Disease: Fusarium Wilt ---
    const diseaseRes = await client.query(
      `INSERT INTO diseases (crop_id, disease_name, description)
       VALUES ($1, $2, $3) RETURNING id`,
      [cropId, riskRules.disease, riskRules.description]
    );
    const diseaseId = diseaseRes.rows[0].id;
    console.log(`✓ Disease created: ${riskRules.disease} (id=${diseaseId})`);

    // --- 4. Disease risk rules ---
    for (const r of riskRules.rules) {
      await client.query(
        `INSERT INTO disease_risk_rules
           (disease_id, rule_name, parameter, operator, min_value, max_value, consecutive_days, score)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          diseaseId,
          r.rule_name,
          r.parameter,
          r.operator,
          r.min_value,
          r.max_value,
          r.consecutive_days,
          r.score,
        ]
      );
    }
    console.log(`✓ ${riskRules.rules.length} disease risk rules created`);

    // --- 5. Disease risk levels ---
    for (const lvl of riskRules.levels) {
      await client.query(
        `INSERT INTO disease_risk_levels (disease_id, min_score, max_score, risk_level, advisory)
         VALUES ($1,$2,$3,$4,$5)`,
        [diseaseId, lvl.min_score, lvl.max_score, lvl.risk_level, lvl.advisory]
      );
    }
    console.log(`✓ ${riskRules.levels.length} disease risk levels created`);

    // --- 6. Nutrient rules ---
    for (const n of nutrients) {
      const stageId = stageIdByName[n.stage];
      if (!stageId) {
        throw new Error(`Nutrient rule references unknown stage "${n.stage}"`);
      }
      await client.query(
        `INSERT INTO nutrient_rules
           (crop_id, stage_id, season, nutrient, fertilizer, soil_threshold,
            dose_under_threshold, dose_above_threshold)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          cropId,
          stageId,
          n.Season_of_Planting,
          n.nutrient,
          n.fertilizer,
          n.Soil_availability_NPK_threshold,
          n.dose_under_threshold_kg_ha,
          n.dose_above_threshold_kg_ha,
        ]
      );
    }
    console.log(`✓ ${nutrients.length} nutrient rules created`);

    // --- 7. Bootstrap admin user ---
    const hash = await bcrypt.hash(config.admin.password, 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
      [config.admin.name, config.admin.email, hash]
    );
    console.log(`✓ Admin user ready: ${config.admin.email}`);
  });
}

seed()
  .then(() => {
    console.log('\n✓ Seed complete.');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ Seed failed:', err.message);
    pool.end().finally(() => process.exit(1));
  });
