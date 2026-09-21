import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { fetchEquipmentById } from '../services/equipmentApi.js'
import { createRequest } from '../services/requestApi.js'

function EquipmentDetailPage() {
  const { id } = useParams()
  const [equipment, setEquipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    fetchEquipmentById(id)
      .then(setEquipment)
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <PageLayout title="Equipment details"><p className="empty-state">Loading equipment...</p></PageLayout>
  }

  if (errorMessage || !equipment) {
    return (
      <PageLayout title="Equipment details">
        <p className="empty-state page-error">{errorMessage || 'Equipment not found'}</p>
        <Link className="back-link" to="/equipment">Back to equipment</Link>
      </PageLayout>
    )
  }

  const canRequest = equipment.status === 'AVAILABLE'

  async function handleRequest() {
    setErrorMessage('')
    setRequestMessage('')
    setIsRequesting(true)
    try {
      await createRequest(equipment._id)
      setEquipment((currentEquipment) => ({ ...currentEquipment, status: 'REQUESTED' }))
      setRequestMessage('Request submitted successfully.')
    } catch (error) {
      setErrorMessage(error.message)
      if (error.message === 'Equipment is no longer available.') {
        setEquipment((currentEquipment) => ({ ...currentEquipment, status: 'REQUESTED' }))
      }
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <PageLayout title="Equipment details">
      <Link className="back-link" to="/equipment">Back to equipment</Link>
      <section className="detail-grid">
        <article className="card detail-card detail-card--summary">
          <div><h2>{equipment.name}</h2><p className="muted-text">{equipment.category}</p></div>
          <StatusBadge status={equipment.status} />
        </article>
        <article className="card detail-card">
          <h2>Equipment details</h2>
          <dl className="detail-list">
            <div><dt>Category</dt><dd>{equipment.category}</dd></div>
            <div><dt>Asset code</dt><dd>{equipment.assetCode}</dd></div>
            <div><dt>Description</dt><dd>{equipment.description}</dd></div>
          </dl>
          <div className="rule-note">
            <h3>First come, first served</h3>
            <p>Once you request this item, it becomes unavailable to other students until the admin makes a decision.</p>
          </div>
          {errorMessage && <p className="form-error">{errorMessage}</p>}
          {requestMessage && <p className="form-message">{requestMessage}</p>}
          {canRequest && <button className="button button-primary" type="button" disabled={isRequesting} onClick={handleRequest}>{isRequesting ? 'Requesting...' : 'Request equipment'}</button>}
        </article>
      </section>
    </PageLayout>
  )
}

export default EquipmentDetailPage
