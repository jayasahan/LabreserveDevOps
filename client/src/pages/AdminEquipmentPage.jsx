import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { deleteEquipment, fetchEquipment } from '../services/equipmentApi.js'

function AdminEquipmentPage() {
  const [equipmentList, setEquipmentList] = useState([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [deletingId, setDeletingId] = useState('')

  useEffect(() => {
    fetchEquipment()
      .then(setEquipmentList)
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  const visibleEquipment = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return equipmentList
    return equipmentList.filter((equipment) =>
      equipment.name.toLowerCase().includes(query) || equipment.assetCode.toLowerCase().includes(query),
    )
  }, [equipmentList, searchText])

  async function handleDelete(equipmentId) {
    setErrorMessage('')
    setDeletingId(equipmentId)
    try {
      await deleteEquipment(equipmentId)
      setEquipmentList((currentItems) => currentItems.filter((equipment) => equipment._id !== equipmentId))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setDeletingId('')
    }
  }

  return (
    <PageLayout role="admin" title="Equipment management" description="Add, edit and manage laboratory equipment availability." actions={<Link className="button button-primary" to="/admin/equipment/new">+ Add equipment</Link>}>
      <input className="search-input search-input--wide" type="search" placeholder="Search by name or asset code..." value={searchText} onChange={(event) => setSearchText(event.target.value)} />
      {errorMessage && <p className="empty-state page-error">{errorMessage}</p>}
      <section className="card table-card admin-equipment-table">
        <div className="table-row table-row--head admin-equipment-row"><span>Equipment</span><span>Category</span><span>Asset code</span><span>Status</span><span>Action</span></div>
        {loading && <p className="empty-state">Loading equipment...</p>}
        {!loading && visibleEquipment.map((equipment) => (
          <div className="table-row admin-equipment-row" key={equipment._id}>
            <strong>{equipment.name}</strong><span>{equipment.category}</span><span>{equipment.assetCode}</span><StatusBadge status={equipment.status} />
            <span className="button-group">
              <Link className="button button-secondary button-compact" to={`/admin/equipment/${equipment._id}/edit`}>Edit</Link>
              <button className="button button-danger button-compact" type="button" disabled={deletingId === equipment._id} onClick={() => handleDelete(equipment._id)}>{deletingId === equipment._id ? 'Deleting...' : 'Delete'}</button>
            </span>
          </div>
        ))}
        {!loading && !errorMessage && visibleEquipment.length === 0 && <p className="empty-state">No equipment matches your search.</p>}
      </section>
    </PageLayout>
  )
}

export default AdminEquipmentPage
