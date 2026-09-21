import { API_URL, getAuthHeaders } from './api.js'

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to complete the equipment request')
  return data
}

export async function fetchEquipment({ search = '', category = '' } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (category && category !== 'All') params.set('category', category)
  const query = params.toString()
  const response = await fetch(`${API_URL}/equipment${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders()
  })
  const data = await readResponse(response)
  return data.equipment
}

export async function fetchEquipmentById(id) {
  const response = await fetch(`${API_URL}/equipment/${id}`, { headers: getAuthHeaders() })
  const data = await readResponse(response)
  return data.equipment
}

export async function createEquipment(equipment) {
  const response = await fetch(`${API_URL}/equipment`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(equipment)
  })
  const data = await readResponse(response)
  return data.equipment
}

export async function updateEquipment(id, equipment) {
  const response = await fetch(`${API_URL}/equipment/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(equipment)
  })
  const data = await readResponse(response)
  return data.equipment
}

export async function deleteEquipment(id) {
  const response = await fetch(`${API_URL}/equipment/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return readResponse(response)
}
