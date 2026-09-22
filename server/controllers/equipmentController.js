const pool = require('../config/mysql')

const equipmentColumns = `
  id,
  name,
  category,
  asset_code AS assetCode,
  description,
  status,
  created_at AS createdAt,
  updated_at AS updatedAt
`

const editableFields = [
  { name: 'name', column: 'name', minLength: 2, maxLength: 150 },
  { name: 'category', column: 'category', maxLength: 100 },
  { name: 'assetCode', column: 'asset_code', maxLength: 100 },
  { name: 'description', column: 'description' }
]

function isValidId(id) {
  if (!/^\d+$/.test(id)) {
    return false
  }

  const numericId = Number(id)
  return Number.isSafeInteger(numericId) && numericId > 0
}

function readEditableFields(body, requireAllFields = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null
  }

  const values = {}

  for (const field of editableFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field.name)) {
      if (requireAllFields) {
        return null
      }

      continue
    }

    if (typeof body[field.name] !== 'string') {
      return null
    }

    let value = body[field.name].trim()
    if (!value || (field.minLength && value.length < field.minLength)) {
      return null
    }

    if (field.maxLength && value.length > field.maxLength) {
      return null
    }

    if (field.name === 'assetCode') {
      value = value.toUpperCase()
    }

    values[field.name] = value
  }

  return Object.keys(values).length > 0 ? values : null
}

function isDuplicateAssetCode(error) {
  return error.code === 'ER_DUP_ENTRY' || error.errno === 1062
}

async function getEquipment(req, res) {
  try {
    const conditions = []
    const parameters = []
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : ''

    if (search) {
      conditions.push('(name LIKE ? OR asset_code LIKE ?)')
      const searchPattern = `%${search}%`
      parameters.push(searchPattern, searchPattern)
    }

    if (category) {
      conditions.push('category = ?')
      parameters.push(category)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const [equipment] = await pool.execute(
      `SELECT ${equipmentColumns} FROM equipment ${whereClause} ORDER BY created_at DESC`,
      parameters
    )

    return res.json({ equipment })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load equipment' })
  }
}

async function getEquipmentById(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' })
  }

  try {
    const [equipmentRows] = await pool.execute(
      `SELECT ${equipmentColumns} FROM equipment WHERE id = ?`,
      [Number(req.params.id)]
    )
    const equipment = equipmentRows[0]

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' })
    }

    return res.json({ equipment })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load equipment' })
  }
}

async function createEquipment(req, res) {
  const values = readEditableFields(req.body, true)

  if (!values) {
    return res.status(400).json({ message: 'Please provide valid equipment details' })
  }

  try {
    const [insertResult] = await pool.execute(
      "INSERT INTO equipment (name, category, asset_code, description, status) VALUES (?, ?, ?, ?, 'AVAILABLE')",
      [values.name, values.category, values.assetCode, values.description]
    )
    const [equipmentRows] = await pool.execute(
      `SELECT ${equipmentColumns} FROM equipment WHERE id = ?`,
      [insertResult.insertId]
    )

    return res.status(201).json({ equipment: equipmentRows[0] })
  } catch (error) {
    if (isDuplicateAssetCode(error)) {
      return res.status(409).json({ message: 'An equipment item with that asset code already exists' })
    }

    return res.status(500).json({ message: 'Unable to create equipment' })
  }
}

async function updateEquipment(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' })
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'status')) {
    return res.status(400).json({ message: 'Equipment status is managed by the request workflow' })
  }

  const values = readEditableFields(req.body)
  if (!values) {
    return res.status(400).json({ message: 'No valid editable equipment fields were provided' })
  }

  try {
    const assignments = []
    const parameters = []

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(values, field.name)) {
        assignments.push(`${field.column} = ?`)
        parameters.push(values[field.name])
      }
    }

    parameters.push(Number(req.params.id))
    await pool.execute(
      `UPDATE equipment SET ${assignments.join(', ')} WHERE id = ?`,
      parameters
    )

    const [equipmentRows] = await pool.execute(
      `SELECT ${equipmentColumns} FROM equipment WHERE id = ?`,
      [Number(req.params.id)]
    )
    const equipment = equipmentRows[0]

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' })
    }

    return res.json({ equipment })
  } catch (error) {
    if (isDuplicateAssetCode(error)) {
      return res.status(409).json({ message: 'An equipment item with that asset code already exists' })
    }

    return res.status(500).json({ message: 'Unable to update equipment' })
  }
}

async function deleteEquipment(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' })
  }

  try {
    const [deleteResult] = await pool.execute(
      "DELETE FROM equipment WHERE id = ? AND status = 'AVAILABLE'",
      [Number(req.params.id)]
    )

    if (deleteResult.affectedRows === 1) {
      return res.json({ message: 'Equipment deleted' })
    }

    const [equipmentRows] = await pool.execute(
      'SELECT status FROM equipment WHERE id = ?',
      [Number(req.params.id)]
    )

    if (equipmentRows.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' })
    }

    return res.status(409).json({ message: 'Requested or borrowed equipment cannot be deleted' })
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Equipment with request history cannot be deleted' })
    }

    return res.status(500).json({ message: 'Unable to delete equipment' })
  }
}

module.exports = { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment }
