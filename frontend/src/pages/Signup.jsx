import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';

// Mirrors backend Joi (auth.validation.js signup).
const schema = Yup.object({
  name: Yup.string().trim().min(2, 'At least 2 characters').max(100).required('Name is required'),
  email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'At least 6 characters').max(128).required('Password is required'),
  phone: Yup.string().trim().max(20, 'Too long').nullable(),
});

export default function Signup() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/fields" replace />;

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const user = await signup({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      });
      toast.success(`Welcome, ${user.name}! Let's add your first field.`);
      // New farmer has no fields yet -> straight to Create Field.
      navigate('/fields/new', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🍉</div>
        <div className="auth-title">Create your account</div>
        <div className="auth-sub">Start getting daily watermelon crop advisories</div>

        <Formik
          initialValues={{ name: '', email: '', password: '', phone: '' }}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <FormField label="Full Name" name="name" placeholder="Ramesh Patel" />
              <FormField label="Email" name="email" type="email" placeholder="you@example.com" />
              <FormField label="Password" name="password" type="password" placeholder="••••••••" />
              <FormField label="Phone (optional)" name="phone" placeholder="+91…" />
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={isSubmitting}
                style={{ marginTop: 6 }}
              >
                {isSubmitting ? 'Creating account…' : 'Sign Up'}
              </button>
            </Form>
          )}
        </Formik>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
