import { sortEquipment } from './equipmentSorting.js'

describe('sortEquipment', () => {
  const equipment = [
    { name: 'Multimeter', createdAt: '2024-01-01T00:00:00.000Z' },
    { name: 'Arduino', createdAt: '2024-03-01T00:00:00.000Z' },
    { name: 'Oscilloscope', createdAt: '2024-02-01T00:00:00.000Z' },
  ]

  test('sorts newest first by default', () => {
    expect(sortEquipment(equipment).map(({ name }) => name)).toEqual([
      'Arduino',
      'Oscilloscope',
      'Multimeter',
    ])
  })

  test('keeps missing and invalid dates after valid dates', () => {
    const itemsWithMissingDates = [
      { name: 'No date' },
      { name: 'Newest', createdAt: '2024-03-01T00:00:00.000Z' },
      { name: 'Invalid date', createdAt: 'not-a-date' },
      { name: 'Older', createdAt: '2024-01-01T00:00:00.000Z' },
    ]

    expect(sortEquipment(itemsWithMissingDates).map(({ name }) => name)).toEqual([
      'Newest',
      'Older',
      'No date',
      'Invalid date',
    ])
  })

  test('sorts names A–Z without case sensitivity', () => {
    expect(sortEquipment(equipment, 'name-asc').map(({ name }) => name)).toEqual([
      'Arduino',
      'Multimeter',
      'Oscilloscope',
    ])
  })

  test('sorts names Z–A without case sensitivity', () => {
    expect(sortEquipment(equipment, 'name-desc').map(({ name }) => name)).toEqual([
      'Oscilloscope',
      'Multimeter',
      'Arduino',
    ])
  })

  test('does not mutate the original array', () => {
    const originalOrder = [...equipment]
    const sortedEquipment = sortEquipment(equipment, 'name-asc')

    expect(sortedEquipment).not.toBe(equipment)
    expect(equipment).toEqual(originalOrder)
  })
})
