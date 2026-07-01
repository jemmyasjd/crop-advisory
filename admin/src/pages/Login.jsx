import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';

const schema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'At least 6 characters').required('Password is required'),
});

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const user = await login(values.email, values.password);
      toast.success(`Welcome, ${user.name}`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🍉</div>
        <div className="auth-title">Crop Advisory Admin</div>
        <div className="auth-sub">Sign in to manage the platform</div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <FormField label="Email" name="email" type="email" placeholder="admin@cropadvisory.com" />
              <FormField label="Password" name="password" type="password" placeholder="••••••••" />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
