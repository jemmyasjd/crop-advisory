import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import useFetch from '../hooks/useFetch';
import { farmersApi } from '../api/services';

export default function Farmers() {
  const navigate = useNavigate();
  const { data, loading, reload } = useFetch(() => farmersApi.list(), []);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await farmersApi.remove(deleting.id);
      toast.success('Farmer deleted');
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
        <h2>Farmers</h2>
      </div>
      <div className="card-body">
        <DataTable
          loading={loading}
          rows={data || []}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            {
              key: 'field_count',
              label: 'Fields',
              render: (r) => <span className="badge badge-gray">{r.field_count ?? 0}</span>,
            },
            {
              key: 'created_at',
              label: 'Joined',
              render: (r) => new Date(r.created_at).toLocaleDateString(),
            },
          ]}
          actions={(row) => (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/farmers/${row.id}`)}>
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
          title="Delete Farmer"
          message={`Delete farmer "${deleting.name}"? All their fields, reports and advisories will be removed.`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
