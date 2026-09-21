import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { fetchEquipment } from '../services/equipmentApi.js'
import { fetchAllRequests } from '../services/requestApi.js'

function AdminDashboardPage() {
  const [equipment, setEquipment] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [equipmentLoading, setEquipmentLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [equipmentError, setEquipmentError] = useState('')
  const [requestsError, setRequestsError] = useState('')

  useEffect(() => {
    fetchEquipment()
      .then(setEquipment)
      .catch((error) => setEquipmentError(error.message))
      .finally(() => setEquipmentLoading(false))
  }, [])

  useEffect(() => {
    fetchAllRequests()
      .then((requests) => setRecentRequests(requests.slice(0, 3)))
      .catch((error) => setRequestsError(error.message))
      .finally(() => setRequestsLoading(false))
  }, [])

  const summary = useMemo(() => ({
    total: equipment.length,
    available: equipment.filter((item) => item.status === 'AVAILABLE').length,
    requested: equipment.filter((item) => item.status === 'REQUESTED').length,
    borrowed: equipment.filter((item) => item.status === 'BORROWED').length,
  }), [equipment])

  const metric = (value) => equipmentLoading ? '...' : value

  return (
    <PageLayout role="admin" title="Admin dashboard" description="Overview of inventory and student requests.">
      <section className="summary-grid summary-grid--admin">
        <article className="card summary-card summary-card--metric"><span className="summary-card__icon summary-card__icon--blue" aria-hidden="true" /><div><strong>{metric(summary.total)}</strong><span>Total equipment</span></div></article>
        <article className="card summary-card summary-card--metric"><span className="summary-card__icon summary-card__icon--green" aria-hidden="true" /><div><strong>{metric(summary.available)}</strong><span>Available</span></div></article>
        <article className="card summary-card summary-card--metric"><span className="summary-card__icon summary-card__icon--yellow" aria-hidden="true" /><div><strong>{metric(summary.requested)}</strong><span>Requested</span></div></article>
        <article className="card summary-card summary-card--metric"><span className="summary-card__icon summary-card__icon--blue" aria-hidden="true" /><div><strong>{metric(summary.borrowed)}</strong><span>Borrowed</span></div></article>
      </section>
      {equipmentError && <p className="empty-state page-error">{equipmentError}</p>}

      <section className="admin-dashboard-grid">
        <div>
          <h2 className="section-title">Recent requests</h2>
          <section className="card table-card admin-recent-card">
            {requestsError && <p className="empty-state page-error">{requestsError}</p>}
            {requestsLoading && !requestsError && <p className="empty-state">Loading requests...</p>}
            {!requestsLoading && !requestsError && recentRequests.length === 0 && <p className="empty-state">No requests yet.</p>}
            {!requestsLoading && !requestsError && recentRequests.map((request) => (
              <div className="table-row recent-request-row" key={request._id}>
                <strong>{request.student?.name || 'Unknown student'}</strong>
                <span>{request.equipment?.name || 'Equipment unavailable'}</span>
                <StatusBadge status={request.status} />
              </div>
            ))}
          </section>
        </div>

        <aside className="card quick-actions-card">
          <h2>Quick actions</h2>
          <div className="quick-actions-card__buttons">
            <Link className="button button-secondary" to="/admin/equipment">Manage equipment</Link>
            <Link className="button button-primary" to="/admin/requests">Review requests</Link>
          </div>
          <div className="quick-actions-card__rule"><h3>System rule</h3><p>Only equipment with AVAILABLE status can be requested.</p></div>
        </aside>
      </section>
    </PageLayout>
  )
}

export default AdminDashboardPage
