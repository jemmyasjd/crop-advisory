/**
 * Disease & Pest Risk Calculator
 * ------------------------------
 * Computes a cumulative 0-100 risk score for a disease from configurable rules
 * stored in `disease_risk_rules`, then maps the score to a level + advisory via
 * `disease_risk_levels`.
 *
 * Rules are evaluated against a weather window (default 3 days) plus today's
 * field soil moisture. Each rule that matches contributes its `score`.
 *
 * Supported parameters:
 *   - avg_temperature : average of (tmax+tmin)/2 across the window
 *   - humidity        : evaluated per-day; with `consecutive_days` the rule
 *                       only matches if it holds on that many consecutive days
 *   - soil_moisture   : today's field soil moisture (%)
 *
 * Supported operators: BETWEEN, GTE, LTE, GT, LT, EQ
 */

/** Round to 2 decimals. */
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Evaluate a single scalar value against a rule's operator/bounds.
 * @returns {boolean}
 */
function compare(value, rule) {
  const min = rule.min_value != null ? Number(rule.min_value) : null;
  const max = rule.max_value != null ? Number(rule.max_value) : null;
  switch (String(rule.operator).toUpperCase()) {
    case 'BETWEEN':
      return value >= min && value <= max;
    case 'GTE':
      return value >= min;
    case 'LTE':
      return value <= (max != null ? max : min);
    case 'GT':
      return value > min;
    case 'LT':
      return value < (max != null ? max : min);
    case 'EQ':
      return value === min;
    default:
      return false;
  }
}

/** Average day temperature = (tmax+tmin)/2 averaged over the window. */
function averageTemperature(weatherWindow) {
  if (!weatherWindow.length) return 0;
  const sum = weatherWindow.reduce(
    (acc, d) => acc + (Number(d.tmax) + Number(d.tmin)) / 2,
    0
  );
  return r2(sum / weatherWindow.length);
}

/**
 * Evaluate one rule, returning a structured evaluation entry.
 * @param {object} rule       - disease_risk_rules row
 * @param {object} ctx        - { weatherWindow, avgTemp, soilMoisture }
 * @returns {{rule, parameter, expected, actual, matched, score}}
 */
function evaluateRule(rule, ctx) {
  const { weatherWindow, avgTemp, soilMoisture } = ctx;
  let matched = false;
  let actual;
  let expected;

  switch (rule.parameter) {
    case 'avg_temperature': {
      actual = avgTemp;
      expected = `${rule.min_value}°C - ${rule.max_value}°C`;
      matched = compare(avgTemp, rule);
      actual = `${avgTemp}°C`;
      break;
    }
    case 'humidity': {
      const days = weatherWindow.map((d) => Number(d.humidity));
      actual = days;
      const n = rule.consecutive_days || days.length;
      // Require the condition to hold on `n` consecutive days within the window.
      let run = 0;
      let bestRun = 0;
      for (const h of days) {
        if (compare(h, rule)) {
          run += 1;
          bestRun = Math.max(bestRun, run);
        } else {
          run = 0;
        }
      }
      matched = bestRun >= n;
      expected = rule.consecutive_days
        ? `${rule.operator === 'GTE' ? '>=' : ''}${rule.min_value}% for ${rule.consecutive_days} consecutive days`
        : `${rule.min_value}%`;
      break;
    }
    case 'soil_moisture': {
      actual = `${soilMoisture}%`;
      expected = `>=${rule.min_value}%`;
      matched = soilMoisture != null && compare(Number(soilMoisture), rule);
      break;
    }
    default: {
      actual = null;
      expected = null;
      matched = false;
    }
  }

  return {
    rule: rule.rule_name,
    parameter: rule.parameter,
    expected,
    actual,
    matched,
    score: matched ? Number(rule.score) : 0,
  };
}

/**
 * Map a total score to a risk level + advisory using the level boundaries.
 * @param {number} score
 * @param {Array<{min_score:number,max_score:number,risk_level:string,advisory:string}>} levels
 */
function resolveLevel(score, levels) {
  const match = levels.find(
    (l) => score >= Number(l.min_score) && score <= Number(l.max_score)
  );
  if (match) return { level: match.risk_level, advisory: match.advisory };
  // Fallback: clamp to the closest boundary.
  const sorted = [...levels].sort((a, b) => a.min_score - b.min_score);
  if (score < Number(sorted[0].min_score)) {
    return { level: sorted[0].risk_level, advisory: sorted[0].advisory };
  }
  const top = sorted[sorted.length - 1];
  return { level: top.risk_level, advisory: top.advisory };
}

/**
 * Compute disease risk for a single disease.
 * @param {object} params
 * @param {Array}  params.rules         - disease_risk_rules rows
 * @param {Array}  params.levels        - disease_risk_levels rows
 * @param {Array}  params.weatherWindow - last N days ({tmax,tmin,humidity})
 * @param {number} params.soilMoisture  - today's field soil moisture %
 * @param {string} [params.diseaseName]
 * @returns {object} risk result with score, level, advisory, evaluation[]
 */
function computeDiseaseRisk({
  rules,
  levels,
  weatherWindow,
  soilMoisture,
  diseaseName,
}) {
  const avgTemp = averageTemperature(weatherWindow);
  const ctx = { weatherWindow, avgTemp, soilMoisture };

  const evaluation = rules.map((rule) => evaluateRule(rule, ctx));
  const rawScore = evaluation.reduce((acc, e) => acc + e.score, 0);
  const score = Math.min(100, Math.max(0, rawScore)); // clamp to 0-100

  const { level, advisory } = resolveLevel(score, levels);

  return {
    disease: diseaseName,
    score,
    level,
    advisory,
    evaluation,
  };
}

module.exports = {
  compare,
  averageTemperature,
  evaluateRule,
  resolveLevel,
  computeDiseaseRisk,
};
