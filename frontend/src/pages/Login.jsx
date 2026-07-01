import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';

const schema = Yup.object({
  email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/fields';

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const user = await login(values.email, values.password);
      toast.success(`Welcome back, ${user.name}`);
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
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Log in to view your fields and advisories</div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <FormField label="Email" name="email" type="email" placeholder="you@example.com" />
              <FormField label="Password" name="password" type="password" placeholder="••••••••" />
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={isSubmitting}
                style={{ marginTop: 6 }}
              >
                {isSubmitting ? 'Logging in…' : 'Log In'}
              </button>
            </Form>
          )}
        </Formik>

        <div className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
