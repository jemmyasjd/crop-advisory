import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import useFetch from '../hooks/useFetch';
import { fieldsApi } from '../api/services';

export default function Fields() {
  const navigate = useNavigate();
  const { data, loading, reload } = useFetch(() => fieldsApi.list(), []);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await fieldsApi.remove(deleting.id);
      toast.success('Field deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>All Fields</h2>
      </div>
      <div className="card-body">
        <DataTable
          loading={loading}
          rows={data || []}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Field' },
            { key: 'crop', label: 'Crop' },
            { key: 'farmer_name', label: 'Farmer' },
            { key: 'season', label: 'Season' },
            { key: 'area_hectare', label: 'Area (ha)', render: (r) => Number(r.area_hectare) },
            {
              key: 'planting_date',
              label: 'Planted',
              render: (r) => (r.planting_date ? String(r.planting_date).slice(0, 10) : '—'),
            },
          ]}
          actions={(row) => (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/fields/${row.id}`)}>
                View
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleting(row)}>
                Delete
              </button>
            </>
          )}
        />
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete Field"
          message={`Delete field "${deleting.name}"? Its soil reports, weather and advisories will be removed.`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
