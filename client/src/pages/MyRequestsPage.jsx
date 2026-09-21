import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { cancelRequest, fetchMyRequests } from '../services/requestApi.js'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function MyRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  useEffect(() => {
    fetchMyRequests()
      .then(setRequests)
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(requestId) {
    setErrorMessage('')
    setCancellingId(requestId)
    try {
      const updatedRequest = await cancelRequest(requestId)
      setRequests((currentRequests) => currentRequests.map((request) => request._id === requestId ? updatedRequest : request))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setCancellingId('')
    }
  }

  return (
    <PageLayout title="My requests" description="Track the equipment you have requested.">
      {loading && <p className="empty-state">Loading requests...</p>}
      {!loading && errorMessage && <p className="empty-state page-error">{errorMessage}</p>}
      {!loading && !errorMessage && requests.length === 0 && <p className="empty-state">You have not submitted any requests.</p>}
      {!loading && !errorMessage && requests.length > 0 && (
        <section className="card table-card requests-table">
          <div className="table-row table-row--head"><span>Equipment</span><span>Requested</span><span>Status</span><span>Updated</span><span>Action</span></div>
          {requests.map((request) => (
            <div className="table-row" key={request._id}>
              <span>{request.equipment?.name || 'Equipment unavailable'}</span>
              <span>{formatDate(request.createdAt)}</span>
              <StatusBadge status={request.status} />
              <span>{formatDate(request.updatedAt)}</span>
              {request.status === 'PENDING' ? <button className="button button-danger" type="button" disabled={cancellingId === request._id} onClick={() => handleCancel(request._id)}>{cancellingId === request._id ? 'Cancelling...' : 'Cancel'}</button> : <span className="dash-value">-</span>}
            </div>
          ))}
        </section>
      )}
    </PageLayout>
  )
}

export default MyRequestsPage
