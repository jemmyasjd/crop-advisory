/**
 * Crop Stage Tracker
 * ------------------
 * Determines the current growth stage of a field from accumulated heat units
 * (Growing Degree Days) since planting.
 *
 * GDD per day = max( ((Tmax + Tmin) / 2) - Tbase , 0 )
 * Total GDD   = sum of daily GDD over all days since planting.
 *
 * For Watermelon, Tbase = 12C.
 */

/**
 * Daily Growing Degree Days for a single day.
 * @param {number} tmax - daily maximum temperature (C)
 * @param {number} tmin - daily minimum temperature (C)
 * @param {number} tBase - crop base temperature (C)
 * @returns {number} GDD contribution for the day (>= 0)
 */
function dailyGdd(tmax, tmin, tBase) {
  return Math.max((tmax + tmin) / 2 - tBase, 0);
}

/**
 * Accumulate GDD across a list of daily weather records.
 * @param {Array<{tmax:number, tmin:number}>} weatherDays
 * @param {number} tBase
 * @returns {number} total accumulated GDD (rounded to 2 decimals)
 */
function accumulateGdd(weatherDays, tBase) {
  const total = weatherDays.reduce(
    (sum, d) => sum + dailyGdd(Number(d.tmax), Number(d.tmin), tBase),
    0
  );
  return Math.round(total * 100) / 100;
}

/**
 * Find the growth stage whose [gdd_start, gdd_end] range contains the given GDD.
 * @param {number} gdd - accumulated GDD
 * @param {Array<{stage_name:string, gdd_start:number, gdd_end:number}>} stages
 * @returns {object|null} the matching stage, or the last stage if GDD exceeds all ranges
 */
function resolveStage(gdd, stages) {
  if (!Array.isArray(stages) || stages.length === 0) return null;

  const ordered = [...stages].sort((a, b) => a.gdd_start - b.gdd_start);

  const match = ordered.find(
    (s) => gdd >= Number(s.gdd_start) && gdd <= Number(s.gdd_end)
  );
  if (match) return match;

  // GDD below the first range -> first stage; above the last range -> last stage.
  if (gdd < Number(ordered[0].gdd_start)) return ordered[0];
  return ordered[ordered.length - 1];
}

/**
 * Days after planting (inclusive of "today" counts as how many GDD-accumulating
 * days have occurred). The assignment states GDD begins accumulating on Day 1
 * and wraps up on Day 3 -> 3 days of accumulation.
 * @param {string|Date} plantingDate
 * @param {string|Date} today
 * @returns {number} whole days elapsed since planting (>= 0)
 */
function daysAfterPlanting(plantingDate, today) {
  // Compare at UTC midnight to avoid timezone-induced off-by-one errors.
  const toUtcMidnight = (d) => {
    const dt = new Date(d);
    return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  };
  const ms = toUtcMidnight(today) - toUtcMidnight(plantingDate);
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Full crop-stage computation.
 * @param {object} params
 * @param {Array} params.weatherDays  - daily weather since planting ({tmax,tmin})
 * @param {number} params.tBase        - crop base temperature
 * @param {Array} params.stages        - crop_stages rows
 * @param {string|Date} [params.plantingDate]
 * @param {string|Date} [params.today]
 * @returns {{gdd:number, stage:object|null, daysAfterPlanting:(number|null)}}
 */
function computeCropStage({ weatherDays, tBase, stages, plantingDate, today }) {
  const gdd = accumulateGdd(weatherDays, tBase);
  const stage = resolveStage(gdd, stages);
  const dap =
    plantingDate && today ? daysAfterPlanting(plantingDate, today) : null;
  return { gdd, stage, daysAfterPlanting: dap };
}

module.exports = {
  dailyGdd,
  accumulateGdd,
  resolveStage,
  daysAfterPlanting,
  computeCropStage,
};
