/**
 * Renders a full advisory payload (the object returned by GET /fields/:id/advisory,
 * or a stored snapshot from advisory history). Pure presentational component.
 */
export default function AdvisoryView({ advisory }) {
  if (!advisory) return null;
  const {
    field,
    cropStage,
    weatherSummary,
    diseaseRisks = [],
    nutrientRecommendations = [],
    aiInsights,
    personalized,
  } = advisory;

  return (
    <div className="stack-16">
      {/* Crop stage */}
      <div className="card">
        <div className="card-header">
          <div className="section-title"><span className="section-icon">🌱</span> Crop Stage</div>
          <span className="badge badge-green">{cropStage?.stage}</span>
        </div>
        <div className="card-body">
          <div className="stat-inline">
            <div className="stat-box"><div className="v">{cropStage?.gdd}</div><div className="l">Accumulated GDD</div></div>
            <div className="stat-box"><div className="v">{cropStage?.daysAfterPlanting}</div><div className="l">Days After Planting</div></div>
            <div className="stat-box"><div className="v">{field?.areaHectare} ha</div><div className="l">Field Area</div></div>
          </div>
        </div>
      </div>

      {/* Weather summary */}
      {weatherSummary && (
        <div className="card">
          <div className="card-header">
            <div className="section-title"><span className="section-icon">🌡️</span> Weather Summary</div>
            <span className="text-muted">{weatherSummary.daysConsidered} days considered</span>
          </div>
          <div className="card-body">
            <div className="stat-inline">
              <div className="stat-box"><div className="v">{weatherSummary.averageTemperature}°C</div><div className="l">Avg Temperature</div></div>
              <div className="stat-box"><div className="v">{weatherSummary.averageHumidity}%</div><div className="l">Avg Humidity</div></div>
              <div className="stat-box"><div className="v">{weatherSummary.todaySoilMoisture ?? '—'}%</div><div className="l">Soil Moisture</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Disease risks */}
      {diseaseRisks.map((risk, i) => (
        <div className="card" key={i}>
          <div className="card-header">
            <div className="section-title"><span className="section-icon">🚦</span> Disease Risk</div>
          </div>
          <div className="card-body stack-16">
            <div className={`risk-banner risk-${risk.level}`}>
              <div>
                <div className="disease-name">{risk.disease}</div>
                <div className="advisory-msg">{risk.advisory}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="risk-score">{risk.score}</div>
                <div style={{ fontWeight: 700 }}>{risk.level}</div>
              </div>
            </div>

            {risk.evaluation?.length > 0 && (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr><th>Rule</th><th>Expected</th><th>Actual</th><th>Matched</th><th>Score</th></tr>
                  </thead>
                  <tbody>
                    {risk.evaluation.map((e, j) => (
                      <tr key={j}>
                        <td>{e.rule}</td>
                        <td>{e.expected}</td>
                        <td>{Array.isArray(e.actual) ? e.actual.join(', ') : e.actual}</td>
                        <td className={e.matched ? 'match-yes' : 'match-no'}>{e.matched ? '✓' : '✗'}</td>
                        <td>+{e.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Nutrient recommendations */}
      <div className="card">
        <div className="card-header">
          <div className="section-title"><span className="section-icon">🧪</span> Nutrient Recommendations</div>
          <span className={`badge ${personalized ? 'badge-green' : 'badge-amber'}`}>
            {personalized ? 'Personalized (soil report)' : 'Stage default'}
          </span>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Nutrient</th><th>Soil Value</th><th>Threshold</th><th>Status</th>
                  <th>Fertilizer</th><th>Dose /ha</th><th>Field Dose</th>
                </tr>
              </thead>
              <tbody>
                {nutrientRecommendations.map((n, i) => (
                  <tr key={i}>
                    <td><strong>{n.nutrient}</strong></td>
                    <td>{n.soilValue ?? '—'}</td>
                    <td>{n.threshold}</td>
                    <td>
                      <span className={`badge ${statusBadge(n.status)}`}>{n.status}</span>
                    </td>
                    <td>{n.fertilizer}</td>
                    <td>{n.dosePerHectareKg} kg</td>
                    <td><strong>{n.fieldDoseKg} kg</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI insights */}
      {aiInsights && (
        <div className="card ai-card">
          <div className="card-header">
            <div className="section-title"><span className="section-icon">🤖</span> AI Insights</div>
          </div>
          <div className="card-body">
            {aiInsights.summary && (
              <div className="ai-block">
                <h4>Summary</h4>
                <p>{aiInsights.summary}</p>
              </div>
            )}
            {(aiInsights.riskExplanation || aiInsights.whyRiskIsHigh) && (
              <div className="ai-block">
                <h4>Why this risk level</h4>
                <p>{aiInsights.riskExplanation || aiInsights.whyRiskIsHigh}</p>
              </div>
            )}
            {aiInsights.precautions?.length > 0 && (
              <div className="ai-block">
                <h4>Precautions</h4>
                <ul className="pill-list">
                  {aiInsights.precautions.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {aiInsights.fertilizerAdvice && (
              <div className="ai-block">
                <h4>Fertilizer Advice</h4>
                <p>{aiInsights.fertilizerAdvice}</p>
              </div>
            )}
            {aiInsights.nextReview && (
              <div className="ai-block">
                <h4>Next Review</h4>
                <p>{aiInsights.nextReview}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function statusBadge(status) {
  const s = String(status).toLowerCase();
  if (s.includes('below')) return 'badge-red';
  if (s.includes('above')) return 'badge-green';
  return 'badge-gray';
}
