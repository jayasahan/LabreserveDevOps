export function sortEquipment(equipmentItems, sortOption = 'newest') {
  return [...equipmentItems].sort((first, second) => {
    if (sortOption === 'name-asc' || sortOption === 'name-desc') {
      const nameOrder = (first.name ?? '').localeCompare(second.name ?? '', undefined, {
        sensitivity: 'base',
      })
      return sortOption === 'name-asc' ? nameOrder : -nameOrder
    }

    const firstCreatedAt = first.createdAt ? new Date(first.createdAt).getTime() : Number.NaN
    const secondCreatedAt = second.createdAt ? new Date(second.createdAt).getTime() : Number.NaN

    if (!Number.isFinite(firstCreatedAt)) {
      return Number.isFinite(secondCreatedAt) ? 1 : 0
    }
    if (!Number.isFinite(secondCreatedAt)) {
      return -1
    }

    return secondCreatedAt - firstCreatedAt
  })
}
