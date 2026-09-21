import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'
import { createEquipment, fetchEquipmentById, updateEquipment } from '../services/equipmentApi.js'

const categories = ['Electronics', 'Networking', 'Embedded Systems', 'Tools']
const emptyEquipment = { name: '', category: '', assetCode: '', description: '' }

function AdminEquipmentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState(emptyEquipment)
  const [loading, setLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isEditing) return
    fetchEquipmentById(id)
      .then((equipment) => setFormData({ name: equipment.name, category: equipment.category, assetCode: equipment.assetCode, description: equipment.description }))
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  function handleChange(event) {
    setFormData((currentData) => ({ ...currentData, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSaving(true)
    try {
      if (isEditing) await updateEquipment(id, formData)
      else await createEquipment(formData)
      navigate('/admin/equipment')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <PageLayout role="admin" title="Edit equipment"><p className="empty-state">Loading equipment...</p></PageLayout>
  }

  return (
    <PageLayout role="admin" title={isEditing ? 'Edit equipment' : 'Add equipment'} description={isEditing ? 'Update this laboratory equipment record.' : 'Create a new laboratory equipment record.'}>
      <section className="admin-form-grid">
        <form className="card admin-equipment-form" onSubmit={handleSubmit}>
          <label className="form-group">Equipment name<input name="name" type="text" placeholder="e.g. Oscilloscope" value={formData.name} onChange={handleChange} required /></label>
          <label className="form-group">Category<select name="category" value={formData.category} onChange={handleChange} required><option value="">Select category</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
          <label className="form-group">Asset code<input name="assetCode" type="text" placeholder="e.g. LAB-OSC-004" value={formData.assetCode} onChange={handleChange} required /></label>
          <label className="form-group">Description<textarea name="description" placeholder="Short equipment description" value={formData.description} onChange={handleChange} required /></label>
          {errorMessage && <p className="form-error">{errorMessage}</p>}
          <div className="button-group"><button className="button button-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save equipment'}</button><Link className="button button-secondary" to="/admin/equipment">Cancel</Link></div>
        </form>
        <aside className="admin-form-note"><h2>Keep it simple</h2><p>Each equipment item only needs a name, category, asset code, description and status. New items start as AVAILABLE.</p></aside>
      </section>
    </PageLayout>
  )
}

export default AdminEquipmentFormPage
