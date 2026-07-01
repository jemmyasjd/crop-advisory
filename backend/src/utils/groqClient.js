/**
 * Groq AI client (OpenAI-compatible chat completions API).
 * Generates a natural-language advisory summary from the computed advisory data.
 *
 * Uses the global fetch available in Node 18+. Fails soft: if the API key is
 * missing or the call errors, returns a deterministic rule-based fallback so the
 * advisory endpoint never breaks because of the LLM.
 */
const config = require('../config');

/** Build the strict JSON-only prompt for the model. */
function buildPrompt(advisory) {
  const { field, cropStage, weatherSummary, diseaseRisks, nutrientRecommendations } =
    advisory;

  return [
    {
      role: 'system',
      content:
        'You are an agronomy advisor for watermelon farmers. ' +
        'Given structured crop advisory data, respond with ONLY a JSON object ' +
        '(no markdown, no prose) with exactly these keys: ' +
        '"summary" (string), "riskExplanation" (string explaining why the disease ' +
        'risk is at its current level — low, moderate or high), "precautions" ' +
        '(array of short strings), "fertilizerAdvice" (string), "nextReview" (string). ' +
        'Keep it practical, concise, and farmer-friendly.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        field,
        cropStage,
        weatherSummary,
        diseaseRisks,
        nutrientRecommendations,
      }),
    },
  ];
}

/** Deterministic fallback when the LLM is unavailable. */
function fallbackInsights(advisory) {
  const stage = advisory.cropStage?.stage || 'current';
  const top = advisory.diseaseRisks?.[0];
  const area = advisory.field?.areaHectare;
  return {
    summary: `Your watermelon crop is in the ${stage} stage.${
      top ? ` Current weather conditions indicate ${top.level} risk for ${top.disease}.` : ''
    }`,
    riskExplanation: top
      ? `Average temperature is ${advisory.weatherSummary?.averageTemperature}°C, ` +
        `humidity averaged ${advisory.weatherSummary?.averageHumidity}%, and soil moisture is ` +
        `${advisory.weatherSummary?.todaySoilMoisture}%. Together these conditions give a ${top.level} risk score of ${top.score} for ${top.disease}.`
      : 'No significant disease risk detected from current weather.',
    precautions: top
      ? [
          top.advisory,
          'Reduce unnecessary irrigation.',
          'Inspect plants daily for wilting symptoms.',
          'Improve field drainage.',
        ]
      : ['Continue routine monitoring.'],
    fertilizerAdvice: `Apply the recommended fertilizers uniformly across the entire ${area}-hectare field, following the suggested dosages based on the latest soil report.`,
    nextReview:
      'Generate another advisory tomorrow after the latest weather data is synchronized.',
  };
}

/**
 * Generate AI insights for an advisory. Always resolves (never throws).
 * @param {object} advisory - the computed advisory (without aiInsights)
 * @returns {Promise<object>} aiInsights object
 */
async function generateInsights(advisory) {
  if (!config.groq.apiKey) {
    return fallbackInsights(advisory);
  }

  try {
    const res = await fetch(config.groq.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.groq.apiKey}`,
      },
      body: JSON.stringify({
        model: config.groq.model,
        messages: buildPrompt(advisory),
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Groq API error:', res.status, text.slice(0, 200));
      return fallbackInsights(advisory);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return fallbackInsights(advisory);

    const parsed = JSON.parse(content);
    // Ensure all expected keys exist; backfill from fallback if the model omits any.
    const fb = fallbackInsights(advisory);
    return {
      summary: parsed.summary || fb.summary,
      riskExplanation: parsed.riskExplanation || parsed.whyRiskIsHigh || fb.riskExplanation,
      precautions: Array.isArray(parsed.precautions) ? parsed.precautions : fb.precautions,
      fertilizerAdvice: parsed.fertilizerAdvice || fb.fertilizerAdvice,
      nextReview: parsed.nextReview || fb.nextReview,
    };
  } catch (err) {
    console.error('Groq request failed:', err.message);
    return fallbackInsights(advisory);
  }
}

module.exports = { generateInsights, fallbackInsights };
