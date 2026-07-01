import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Crops from './pages/Crops';
import Stages from './pages/Stages';
import Diseases from './pages/Diseases';
import DiseaseRules from './pages/DiseaseRules';
import RiskLevels from './pages/RiskLevels';
import NutrientRules from './pages/NutrientRules';
import Farmers from './pages/Farmers';
import FarmerDetail from './pages/FarmerDetail';
import Fields from './pages/Fields';
import FieldDetail from './pages/FieldDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/stages" element={<Stages />} />
        <Route path="/diseases" element={<Diseases />} />
        <Route path="/disease-rules" element={<DiseaseRules />} />
        <Route path="/risk-levels" element={<RiskLevels />} />
        <Route path="/nutrient-rules" element={<NutrientRules />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/farmers/:id" element={<FarmerDetail />} />
        <Route path="/fields" element={<Fields />} />
        <Route path="/fields/:id" element={<FieldDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
