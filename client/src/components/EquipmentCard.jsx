import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'

function EquipmentCard({ equipment }) {
  const equipmentId = equipment._id || equipment.id

  return (
    <article className="equipment-card">
      <div>
        <h2 className="equipment-card__title">{equipment.name}</h2>
        <p className="equipment-card__category">{equipment.category}</p>
      </div>
      <StatusBadge status={equipment.status} />
      <Link className="button button-secondary equipment-card__link" to={`/equipment/${equipmentId}`}>
        View details
      </Link>
    </article>
  )
}

export default EquipmentCard
