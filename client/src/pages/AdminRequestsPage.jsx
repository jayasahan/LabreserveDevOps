import { useEffect, useMemo, useState } from 'react'
import PageLayout from '../components/PageLayout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { approveRequest, fetchAllRequests, rejectRequest, returnRequest } from '../services/requestApi.js'

const requestFilters = ['All', 'Pending', 'Approved', 'Rejected', 'Returned']

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function AdminRequestsPage() {
  const [selectedFilter, setSelectedFilter] = useState('Pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionId, setActionId] = useState('')

  useEffect(() => {
    fetchAllRequests()
      .then(setRequests)
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  const visibleRequests = useMemo(() => {
    if (selectedFilter === 'All') return requests
    return requests.filter((request) => request.status === selectedFilter.toUpperCase())
  }, [requests, selectedFilter])

  async function handleAction(requestId, action) {
    setErrorMessage('')
    setActionId(requestId)
    try {
      const actions = { approve: approveRequest, reject: rejectRequest, return: returnRequest }
      const updatedRequest = await actions[action](requestId)
      setRequests((currentRequests) => currentRequests.map((request) => request._id === requestId ? updatedRequest : request))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setActionId('')
    }
  }

  return (
    <PageLayout role="admin" title="Request management" description="Review first-come, first-served student requests.">
      <div className="filter-row">{requestFilters.map((filter) => <button className={`filter-chip${selectedFilter === filter ? ' filter-chip--active' : ''}`} type="button" onClick={() => setSelectedFilter(filter)} key={filter}>{filter}</button>)}</div>
      {errorMessage && <p className="empty-state page-error">{errorMessage}</p>}
      <section className="card table-card admin-requests-table">
        <div className="table-row table-row--head admin-request-row"><span>Student</span><span>Equipment</span><span>Requested</span><span>Status</span><span>Actions</span></div>
        {loading && <p className="empty-state">Loading requests...</p>}
        {!loading && visibleRequests.map((request) => (
          <div className="table-row admin-request-row" key={request._id}>
            <strong>{request.student?.name || 'Unknown student'}</strong>
            <span>{request.equipment?.name || 'Equipment unavailable'}</span>
            <span className="admin-request-row__date"><span className="admin-request-row__desktop-date">{formatDate(request.createdAt)}</span><span className="admin-request-row__mobile-date">{formatDate(request.createdAt)}</span></span>
            <StatusBadge status={request.status} />
            <span className="button-group admin-request-actions">
              {request.status === 'PENDING' && <><button className="button button-primary" type="button" disabled={actionId === request._id} onClick={() => handleAction(request._id, 'approve')}>Approve</button><button className="button button-danger" type="button" disabled={actionId === request._id} onClick={() => handleAction(request._id, 'reject')}>Reject</button></>}
              {request.status === 'APPROVED' && <button className="button button-secondary" type="button" disabled={actionId === request._id} onClick={() => handleAction(request._id, 'return')}>Mark returned</button>}
              {!['PENDING', 'APPROVED'].includes(request.status) && <span className="dash-value">-</span>}
            </span>
          </div>
        ))}
        {!loading && !errorMessage && visibleRequests.length === 0 && <p className="empty-state">No requests match this filter.</p>}
      </section>
    </PageLayout>
  )
}

export default AdminRequestsPage
