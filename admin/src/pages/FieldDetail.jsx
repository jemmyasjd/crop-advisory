import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import useFetch from '../hooks/useFetch';
import { fieldsApi } from '../api/services';

export default function FieldDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => fieldsApi.get(id), [id]);

  if (loading) return <Loader />;
  if (!data) return <div className="card"><div className="card-body">Field not found.</div></div>;

  const fmtDate = (d) => (d ? String(d).slice(0, 10) : '—');

  return (
    <>
      <div className="page-head">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/fields')}>
          ← Back to Fields
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{data.name}</h2>
          <span className="badge badge-green">{data.crop}</span>
        </div>
        <div className="card-body">
          <dl className="detail-grid">
            <dt>Field ID</dt><dd>{data.id}</dd>
            <dt>Farmer</dt>
            <dd>
              {data.farmer_name}
              {data.farmer_email ? ` (${data.farmer_email})` : ''}
            </dd>
            <dt>Crop</dt><dd>{data.crop}</dd>
            <dt>Season</dt><dd>{data.season || '—'}</dd>
            <dt>Area</dt><dd>{Number(data.area_hectare)} ha</dd>
            <dt>Planting Date</dt><dd>{fmtDate(data.planting_date)}</dd>
            <dt>Latitude</dt><dd>{data.latitude ?? '—'}</dd>
            <dt>Longitude</dt><dd>{data.longitude ?? '—'}</dd>
            <dt>Created</dt><dd>{data.created_at ? new Date(data.created_at).toLocaleString() : '—'}</dd>
          </dl>
        </div>
      </div>
    </>
  );
}
