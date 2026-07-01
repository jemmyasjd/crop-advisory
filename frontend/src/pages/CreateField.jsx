import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';
import FieldForm from '../components/FieldForm';
import { cropsApi, fieldsApi } from '../api/services';

export default function CreateField() {
  const navigate = useNavigate();
  const { data: crops, loading } = useFetch(() => cropsApi.list(), []);

  const handleSubmit = async (payload) => {
    try {
      const field = await fieldsApi.create(payload);
      toast.success('Field created! Weather data has been synced.');
      // Per the flow: land on the field detail page.
      navigate(`/fields/${field.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not create field');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="container-narrow">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container-narrow">
      <div className="back-link" onClick={() => navigate('/fields')}>
        ← Back to My Fields
      </div>
      <div className="card">
        <div className="card-header">
          <h2>Add a New Field</h2>
        </div>
        <div className="card-body">
          <div className="info-note">
            <span>💡</span>
            <span>
              Once you add a field, we automatically fetch the last 3 days of weather so you can
              generate an advisory right away. Add a soil report later for personalized nutrient
              recommendations.
            </span>
          </div>
          <FieldForm
            crops={crops || []}
            onSubmit={handleSubmit}
            submitLabel="Create Field"
            onCancel={() => navigate('/fields')}
          />
        </div>
      </div>
    </div>
  );
}
