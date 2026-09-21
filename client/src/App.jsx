import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import EquipmentPage from './pages/EquipmentPage.jsx'
import EquipmentDetailPage from './pages/EquipmentDetailPage.jsx'
import MyRequestsPage from './pages/MyRequestsPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminEquipmentPage from './pages/AdminEquipmentPage.jsx'
import AdminEquipmentFormPage from './pages/AdminEquipmentFormPage.jsx'
import AdminRequestsPage from './pages/AdminRequestsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/equipment" element={<AdminEquipmentPage />} />
              <Route path="/admin/equipment/new" element={<AdminEquipmentFormPage />} />
              <Route path="/admin/equipment/:id/edit" element={<AdminEquipmentFormPage />} />
              <Route path="/admin/requests" element={<AdminRequestsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
