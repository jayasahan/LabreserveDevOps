const statusClasses = {
  AVAILABLE: 'status-badge--available',
  REQUESTED: 'status-badge--requested',
  BORROWED: 'status-badge--borrowed',
  PENDING: 'status-badge--pending',
  APPROVED: 'status-badge--approved',
  REJECTED: 'status-badge--rejected',
  RETURNED: 'status-badge--returned',
  CANCELLED: 'status-badge--cancelled',
}

function formatStatus(status) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toUpperCase()
  const className = statusClasses[normalizedStatus] || 'status-badge--default'

  return <span className={`status-badge ${className}`}>{formatStatus(normalizedStatus || 'UNKNOWN')}</span>
}

export default StatusBadge
