import { useParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import useFetch from '../hooks/useFetch';
import { farmersApi } from '../api/services';

export default function FarmerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => farmersApi.get(id), [id]);

  if (loading) return <Loader />;
  if (!data) return <div className="card"><div className="card-body">Farmer not found.</div></div>;

  return (
    <>
      <div className="page-head">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/farmers')}>
          ← Back to Farmers
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2>{data.name}</h2>
          <span className="badge badge-green">{data.role}</span>
        </div>
        <div className="card-body">
          <dl className="detail-grid">
            <dt>ID</dt><dd>{data.id}</dd>
            <dt>Email</dt><dd>{data.email}</dd>
            <dt>Phone</dt><dd>{data.phone || '—'}</dd>
            <dt>Joined</dt><dd>{new Date(data.created_at).toLocaleString()}</dd>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Fields ({data.fields?.length || 0})</h2>
        </div>
        <div className="card-body">
          <DataTable
            loading={false}
            rows={data.fields || []}
            emptyText="This farmer has no fields"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'crop', label: 'Crop' },
              { key: 'season', label: 'Season' },
              { key: 'area_hectare', label: 'Area (ha)', render: (r) => Number(r.area_hectare) },
              {
                key: 'planting_date',
                label: 'Planted',
                render: (r) => (r.planting_date ? String(r.planting_date).slice(0, 10) : '—'),
              },
            ]}
            actions={(row) => (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/fields/${row.id}`)}>
                View
              </button>
            )}
          />
        </div>
      </div>
    </>
  );
}
