import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) return <main className="route-loading">Loading...</main>
  if (!user) return <Navigate to="/" replace />
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/equipment'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
