const { query } = require('../db/pool');

/**
 * Weather provisioning for a field.
 *
 * Primary source: the Open-Meteo forecast API (free, no key) queried with the
 * field's lat/long for the last `days` days of daily aggregates. If the field
 * has no coordinates, or the API is unreachable / returns no data, we fall back
 * to a deterministic synthetic generator so the advisory engine always has data.
 */

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch daily weather aggregates for the last `days` days (plus today) from
 * Open-Meteo. Returns an array of records mapped to our schema, or null on any
 * failure / missing coordinates.
 * @returns {Promise<Array<{weatherDate,tmax,tmin,humidity,rainfall,et0}>|null>}
 */
async function fetchFromOpenMeteo(latitude, longitude, days = 3) {
  if (latitude == null || longitude == null) return null;
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily:
        'temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,et0_fao_evapotranspiration',
      // past_days covers the last N days; forecast_days:1 includes today.
      past_days: String(days),
      forecast_days: '1',
      timezone: 'UTC',
    });

    const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
    if (!res.ok) {
      console.error('Open-Meteo error:', res.status);
      return null;
    }
    const json = await res.json();
    const d = json.daily;
    if (!d || !Array.isArray(d.time) || !d.time.length) return null;

    // Map each day; keep only the most recent `days` entries (oldest -> newest).
    const records = d.time.map((date, i) => ({
      weatherDate: date,
      tmax: numOr(d.temperature_2m_max[i]),
      tmin: numOr(d.temperature_2m_min[i]),
      humidity: numOr(d.relative_humidity_2m_mean[i]),
      rainfall: numOr(d.precipitation_sum[i]),
      et0: numOr(d.et0_fao_evapotranspiration[i]),
    }));
    return records.slice(-days);
  } catch (err) {
    console.error('Open-Meteo request failed:', err.message);
    return null;
  }
}

function numOr(v, fallback = null) {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function seeded(n) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

/** Build a synthetic daily weather record for a given date. */
function synthDay(dateStr) {
  const t = Date.parse(dateStr) / 86400000; // day index
  const r = seeded(t);
  const r2 = seeded(t + 1);
  const tmax = Math.round((28 + r * 6) * 10) / 10; // 28-34
  const tmin = Math.round((tmax - (7 + r2 * 4)) * 10) / 10; // 7-11 below tmax
  const humidity = Math.round((70 + seeded(t + 2) * 25) * 10) / 10; // 70-95
  const rainfall = Math.round(seeded(t + 3) * 20 * 10) / 10; // 0-20mm
  const et0 = Math.round((3 + seeded(t + 4) * 2) * 10) / 10; // 3-5mm
  return { weatherDate: dateStr, tmax, tmin, humidity, rainfall, et0 };
}

/** ISO date string (YYYY-MM-DD) for `offset` days before `base`. */
function isoDateOffset(base, offset) {
  const d = new Date(base);
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch and store the last `days` days of weather for a field, ending on
 * `endDate` (default: today). Tries Open-Meteo first (using lat/long), and
 * falls back to the deterministic synthetic generator if real data is
 * unavailable. Upserts on (field_id, weather_date).
 *
 * @param {object|null} client - optional PG client (to run inside a transaction)
 * @param {number} fieldId
 * @param {string} endDate - 'YYYY-MM-DD'
 * @param {number} days
 * @param {{latitude?:number, longitude?:number}} [coords]
 * @returns {Promise<{source:string, records:Array}>}
 */
async function syncRecentWeather(client, fieldId, endDate, days = 3, coords = {}) {
  const exec = client ? client.query.bind(client) : query;

  // 1. Try real data from Open-Meteo.
  let source = 'open-meteo';
  let records = await fetchFromOpenMeteo(coords.latitude, coords.longitude, days);

  // 2. Fall back to synthetic if the API gave nothing.
  if (!records || !records.length) {
    source = 'synthetic';
    records = [];
    for (let i = days - 1; i >= 0; i--) {
      records.push(synthDay(isoDateOffset(endDate, i)));
    }
  }

  // 3. Persist (upsert) every record.
  for (const w of records) {
    await exec(
      `INSERT INTO weather_records (field_id, weather_date, tmax, tmin, humidity, rainfall, et0)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (field_id, weather_date) DO UPDATE SET
         tmax = EXCLUDED.tmax, tmin = EXCLUDED.tmin, humidity = EXCLUDED.humidity,
         rainfall = EXCLUDED.rainfall, et0 = EXCLUDED.et0`,
      [fieldId, w.weatherDate, w.tmax, w.tmin, w.humidity, w.rainfall, w.et0]
    );
  }

  return { source, records };
}

/** Get the last `days` weather records for a field, oldest-first. */
async function getRecentWeather(fieldId, days = 3) {
  const { rows } = await query(
    `SELECT weather_date, tmax, tmin, humidity, rainfall, et0
     FROM weather_records
     WHERE field_id = $1
     ORDER BY weather_date DESC
     LIMIT $2`,
    [fieldId, days]
  );
  return rows.reverse(); // oldest -> newest
}

/** Get all weather records for a field since planting, oldest-first. */
async function getWeatherSincePlanting(fieldId, plantingDate) {
  const { rows } = await query(
    `SELECT weather_date, tmax, tmin, humidity, rainfall, et0
     FROM weather_records
     WHERE field_id = $1 AND weather_date > $2
     ORDER BY weather_date ASC`,
    [fieldId, plantingDate]
  );
  return rows;
}

module.exports = {
  fetchFromOpenMeteo,
  synthDay,
  isoDateOffset,
  syncRecentWeather,
  getRecentWeather,
  getWeatherSincePlanting,
};
