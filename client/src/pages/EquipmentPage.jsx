import { useEffect, useMemo, useState } from 'react'
import EquipmentCard from '../components/EquipmentCard.jsx'
import PageLayout from '../components/PageLayout.jsx'
import { fetchEquipment } from '../services/equipmentApi.js'
import { sortEquipment } from '../utils/equipmentSorting.js'

function EquipmentPage() {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortOption, setSortOption] = useState('newest')
  const [equipmentItems, setEquipmentItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchEquipment()
      .then(setEquipmentItems)
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(
    () => ['All', ...new Set(equipmentItems.map((equipment) => equipment.category))],
    [equipmentItems],
  )

  const visibleEquipment = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    const filteredEquipment = equipmentItems.filter((equipment) => {
      const matchesCategory = selectedCategory === 'All' || equipment.category === selectedCategory
      const matchesSearch =
        !normalizedSearch ||
        equipment.name.toLowerCase().includes(normalizedSearch) ||
        equipment.category.toLowerCase().includes(normalizedSearch) ||
        equipment.assetCode.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })

    return sortEquipment(filteredEquipment, sortOption)
  }, [equipmentItems, searchText, selectedCategory, sortOption])

  return (
    <PageLayout
      title="Available equipment"
      description="Browse and request currently available laboratory items."
    >
      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search equipment..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <div className="equipment-sort">
          <label htmlFor="equipment-sort">Sort by</label>
          <select
            id="equipment-sort"
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
          </select>
        </div>
        <div className="filter-row" aria-label="Equipment categories">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-chip${selectedCategory === category ? ' filter-chip--active' : ''}`}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'Embedded Systems' ? 'Embedded' : category}
            </button>
          ))}
        </div>
      </div>

      <section className="equipment-grid" aria-label="Equipment list">
        {loading && <p className="empty-state">Loading equipment...</p>}
        {!loading && errorMessage && <p className="empty-state page-error">{errorMessage}</p>}
        {!loading && !errorMessage && visibleEquipment.map((equipment) => (
          <EquipmentCard key={equipment._id} equipment={equipment} />
        ))}
        {!loading && !errorMessage && visibleEquipment.length === 0 && (
          <p className="empty-state">No equipment matches your search.</p>
        )}
      </section>
    </PageLayout>
  )
}

export default EquipmentPage
