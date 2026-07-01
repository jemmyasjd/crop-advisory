import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';
import { fieldsApi } from '../api/services';

export default function MyFields() {
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => fieldsApi.list(), []);

  if (loading) {
    return (
      <div className="container">
        <Loader />
      </div>
    );
  }

  const fields = data || [];

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>My Fields</h1>
          <div className="page-sub">Manage your fields and generate crop advisories</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/fields/new')}>
          + Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="emoji">🌱</div>
            <h2>No fields yet</h2>
            <p>Add your first field to start receiving crop advisories.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/fields/new')}>
              + Add Your First Field
            </button>
          </div>
        </div>
      ) : (
        <div className="field-grid">
          {fields.map((f) => (
            <div key={f.id} className="field-card" onClick={() => navigate(`/fields/${f.id}`)}>
              <div className="field-card-top">
                <h3>{f.name}</h3>
                <div className="field-card-crop">🌿 {f.crop}</div>
              </div>
              <div className="field-card-body">
                <div className="field-meta">
                  <span>Season</span>
                  <span>{f.season || '—'}</span>
                </div>
                <div className="field-meta">
                  <span>Area</span>
                  <span>{f.areaHectare} ha</span>
                </div>
                <div className="field-meta">
                  <span>Planted</span>
                  <span>{f.plantingDate}</span>
                </div>
              </div>
              <div className="field-card-foot">
                <button
                  className="btn btn-primary btn-sm btn-block"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/fields/${f.id}/advisories`);
                  }}
                >
                  Get Advisory
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
