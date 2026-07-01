import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';
import FieldForm from '../components/FieldForm';
import { cropsApi, fieldsApi } from '../api/services';

export default function EditField() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: crops, loading: loadingCrops } = useFetch(() => cropsApi.list(), []);
  const { data: field, loading: loadingField } = useFetch(() => fieldsApi.get(id), [id]);

  const handleSubmit = async (payload) => {
    try {
      await fieldsApi.update(id, payload);
      toast.success('Field updated');
      navigate(`/fields/${id}`);
    } catch (err) {
      toast.error(err.message || 'Could not update field');
      throw err;
    }
  };

  if (loadingCrops || loadingField) {
    return (
      <div className="container-narrow">
        <Loader />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="container-narrow">
        <div className="card"><div className="card-body">Field not found.</div></div>
      </div>
    );
  }

  return (
    <div className="container-narrow">
      <div className="back-link" onClick={() => navigate(`/fields/${id}`)}>
        ← Back to Field
      </div>
      <div className="card">
        <div className="card-header">
          <h2>Edit Field</h2>
        </div>
        <div className="card-body">
          <FieldForm
            initial={field}
            crops={crops || []}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            onCancel={() => navigate(`/fields/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
