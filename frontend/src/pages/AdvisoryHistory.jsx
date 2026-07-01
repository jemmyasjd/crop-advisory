import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AdvisoryView from '../components/AdvisoryView';
import { advisoryApi, fieldsApi } from '../api/services';

export default function AdvisoryHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: field } = useFetch(() => fieldsApi.get(id), [id], false);
  const { data, loading, reload } = useFetch(() => advisoryApi.history(id), [id]);

  const [generating, setGenerating] = useState(false);
  const [fresh, setFresh] = useState(null); // just-generated advisory (shown at top)
  const [selected, setSelected] = useState(null); // history item viewed in modal
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = data || [];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await advisoryApi.generate(id);
      setFresh(result);
      toast.success('Advisory generated');
      reload(); // refresh history list to include the new one
    } catch (err) {
      toast.error(err.message || 'Could not generate advisory');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await advisoryApi.remove(id, deleting.id);
      toast.success('Advisory deleted');
      // If the freshly-shown advisory was the one deleted, clear it.
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="back-link" onClick={() => navigate(`/fields/${id}`)}>
        ← Back to Field
      </div>

      <div className="page-head">
        <div>
          <h1>Crop Advisory</h1>
          <div className="page-sub">
            {field ? `${field.name} · ${field.crop}` : 'Advisory history for this field'}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : '＋ Generate New Advisory'}
        </button>
      </div>

      {/* Freshly generated advisory shown inline at the top */}
      {generating && (
        <div className="card" style={{ marginBottom: 18 }}>
          <Loader text="Generating advisory…" />
        </div>
      )}
      {fresh && !generating && (
        <div style={{ marginBottom: 24 }}>
          <div className="info-note">
            <span>Latest advisory generated just now. It has been saved to your history below.</span>
          </div>
          <AdvisoryView advisory={fresh} />
        </div>
      )}

      {/* History list */}
      <div className="card">
        <div className="card-header">
          <h2>History</h2>
          <span className="text-muted">{items.length} advisories</span>
        </div>
        <div className="card-body">
          {loading ? (
            <Loader />
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">🕑</div>
              <h2>No advisories yet</h2>
              <p>Click “Generate New Advisory” above to create your first one.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>Generated</th><th>Stage</th><th>GDD</th><th>Top Risk</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const risk = it.advisory?.diseaseRisks?.[0];
                    return (
                      <tr key={it.id}>
                        <td>{new Date(it.generatedAt).toLocaleString()}</td>
                        <td>{it.stage}</td>
                        <td>{it.gdd}</td>
                        <td>
                          {risk ? (
                            <span className={`badge ${risk.level === 'HIGH' ? 'badge-red' : risk.level === 'MODERATE' ? 'badge-amber' : 'badge-green'}`}>
                              {risk.level} ({risk.score})
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(it)}>
                              View
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleting(it)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <Modal
          wide
          title={`Advisory · ${new Date(selected.generatedAt).toLocaleString()}`}
          onClose={() => setSelected(null)}
        >
          <AdvisoryView advisory={selected.advisory} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Advisory"
          message={`Delete the advisory generated on ${new Date(deleting.generatedAt).toLocaleString()}?`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
