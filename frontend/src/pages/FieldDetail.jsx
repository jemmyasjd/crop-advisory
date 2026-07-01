import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import SoilReportModal from '../components/SoilReportModal';
import { fieldsApi, soilApi } from '../api/services';

export default function FieldDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: field, loading } = useFetch(() => fieldsApi.get(id), [id]);
  const {
    data: soilReports,
    loading: loadingSoil,
    reload: reloadSoil,
  } = useFetch(() => soilApi.history(id), [id], false);

  const [showSoilModal, setShowSoilModal] = useState(false);
  const [deletingField, setDeletingField] = useState(false);
  const [deletingReport, setDeletingReport] = useState(null);
  const [busy, setBusy] = useState(false);

  const reports = soilReports || [];
  const latest = reports[0];

  const handleAddSoil = async (payload) => {
    try {
      await soilApi.create(id, payload);
      toast.success('Soil report uploaded');
      setShowSoilModal(false);
      reloadSoil();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      throw err;
    }
  };

  const handleDeleteField = async () => {
    setBusy(true);
    try {
      await fieldsApi.remove(id);
      toast.success('Field deleted');
      navigate('/fields', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Delete failed');
      setBusy(false);
    }
  };

  const handleDeleteReport = async () => {
    setBusy(true);
    try {
      await soilApi.remove(deletingReport.id);
      toast.success('Soil report deleted');
      setDeletingReport(null);
      reloadSoil();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <Loader />
      </div>
    );
  }
  if (!field) {
    return (
      <div className="container">
        <div className="card"><div className="card-body">Field not found.</div></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="back-link" onClick={() => navigate('/fields')}>
        ← Back to My Fields
      </div>

      <div className="page-head">
        <div>
          <h1>{field.name}</h1>
          <div className="page-sub">🌿 {field.crop} · {field.season || 'No season'}</div>
        </div>
        <div className="row-actions">
          <button className="btn btn-primary" onClick={() => navigate(`/fields/${id}/advisories`)}>
            📋 Get Advisory
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/fields/${id}/edit`)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={() => setDeletingField(true)}>
            Delete
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Field info */}
        <div className="card">
          <div className="card-header"><h2>Field Details</h2></div>
          <div className="card-body">
            <dl className="detail-grid">
              <dt>Crop</dt><dd>{field.crop}</dd>
              <dt>Season</dt><dd>{field.season || '—'}</dd>
              <dt>Area</dt><dd>{field.areaHectare} ha</dd>
              <dt>Planting Date</dt><dd>{field.plantingDate}</dd>
              <dt>Latitude</dt><dd>{field.latitude ?? '—'}</dd>
              <dt>Longitude</dt><dd>{field.longitude ?? '—'}</dd>
            </dl>
          </div>
        </div>

        {/* Soil reports */}
        <div className="card">
          <div className="card-header">
            <h2>Soil Reports</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setShowSoilModal(true)}>
              + Upload
            </button>
          </div>
          <div className="card-body">
            {loadingSoil ? (
              <Loader />
            ) : reports.length === 0 ? (
              <div className="info-note">
                <span>🧪</span>
                <span>
                  No soil report yet. The advisory will use stage-default nutrient doses. Upload a
                  soil report for personalized recommendations.
                </span>
              </div>
            ) : (
              <>
                {latest && (
                  <div style={{ marginBottom: 14 }}>
                    <span className="badge badge-green">Latest · {latest.reportDate}</span>
                    <div className="stat-inline" style={{ marginTop: 12 }}>
                      <div className="stat-box"><div className="v">{latest.nitrogen}</div><div className="l">Nitrogen</div></div>
                      <div className="stat-box"><div className="v">{latest.phosphorus}</div><div className="l">Phosphorus</div></div>
                      <div className="stat-box"><div className="v">{latest.potassium}</div><div className="l">Potassium</div></div>
                      <div className="stat-box"><div className="v">{latest.soilMoisture ?? '—'}</div><div className="l">Moisture %</div></div>
                    </div>
                  </div>
                )}
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Date</th><th>N</th><th>P</th><th>K</th><th>Moist %</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.id}>
                          <td>{r.reportDate}</td>
                          <td>{r.nitrogen}</td>
                          <td>{r.phosphorus}</td>
                          <td>{r.potassium}</td>
                          <td>{r.soilMoisture ?? '—'}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeletingReport(r)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showSoilModal && (
        <SoilReportModal onClose={() => setShowSoilModal(false)} onSubmit={handleAddSoil} />
      )}
      {deletingField && (
        <ConfirmDialog
          title="Delete Field"
          message={`Delete "${field.name}"? Its soil reports, weather and advisories will be removed.`}
          onConfirm={handleDeleteField}
          onClose={() => setDeletingField(false)}
          busy={busy}
        />
      )}
      {deletingReport && (
        <ConfirmDialog
          title="Delete Soil Report"
          message={`Delete the soil report from ${deletingReport.reportDate}?`}
          onConfirm={handleDeleteReport}
          onClose={() => setDeletingReport(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
