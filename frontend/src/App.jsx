import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Signup from './pages/Signup';
import Login from './pages/Login';
import MyFields from './pages/MyFields';
import CreateField from './pages/CreateField';
import EditField from './pages/EditField';
import FieldDetail from './pages/FieldDetail';
import AdvisoryHistory from './pages/AdvisoryHistory';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Protected (with navbar layout) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/fields" element={<MyFields />} />
        <Route path="/fields/new" element={<CreateField />} />
        <Route path="/fields/:id" element={<FieldDetail />} />
        <Route path="/fields/:id/edit" element={<EditField />} />
        <Route path="/fields/:id/advisories" element={<AdvisoryHistory />} />
        {/* Legacy path -> advisory hub */}
        <Route path="/fields/:id/advisory" element={<AdvisoryRedirect />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/" element={<Navigate to="/fields" replace />} />
      <Route path="*" element={<Navigate to="/fields" replace />} />
    </Routes>
  );
}

/** Redirects the legacy /fields/:id/advisory path to the advisory hub. */
function AdvisoryRedirect() {
  const { id } = useParams();
  return <Navigate to={`/fields/${id}/advisories`} replace />;
}
