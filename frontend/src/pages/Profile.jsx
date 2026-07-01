import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';
import FormField from '../components/FormField';
import { profileApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

// Mirrors backend Joi (profile.validation.js). All fields optional; password
// blank means "don't change".
const schema = Yup.object({
  name: Yup.string().trim().min(2, 'At least 2 characters').max(100).required('Name is required'),
  phone: Yup.string().trim().max(20).nullable(),
  password: Yup.string()
    .transform((v) => (v === '' ? undefined : v))
    .min(6, 'At least 6 characters')
    .max(128),
});

export default function Profile() {
  const { updateUser } = useAuth();
  const { data: profile, loading } = useFetch(() => profileApi.get(), []);

  if (loading) {
    return (
      <div className="container-narrow">
        <Loader />
      </div>
    );
  }

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = { name: values.name, phone: values.phone || null };
      if (values.password) payload.password = values.password;
      const updated = await profileApi.update(payload);
      updateUser({ name: updated.name });
      toast.success('Profile updated');
      resetForm({ values: { ...values, password: '' } });
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-narrow">
      <div className="page-head">
        <h1>My Profile</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <Formik
            initialValues={{
              name: profile?.name || '',
              phone: profile?.phone || '',
              password: '',
            }}
            validationSchema={schema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form>
                <FormField label="Full Name" name="name" />
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" value={profile?.email || ''} disabled />
                  <div className="field-hint">Email cannot be changed.</div>
                </div>
                <FormField label="Phone" name="phone" placeholder="+91…" />
                <FormField
                  label="New Password"
                  name="password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  hint="Only fill this if you want to change your password."
                />
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
