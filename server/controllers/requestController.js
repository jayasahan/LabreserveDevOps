const pool = require('../config/mysql')

const maxIntegerId = 2147483647

const requestWithEquipmentSql = `
  SELECT
    r.id,
    r.id AS _id,
    r.status,
    r.created_at AS createdAt,
    r.updated_at AS updatedAt,
    e.id AS equipmentId,
    e.name AS equipmentName,
    e.asset_code AS equipmentAssetCode,
    e.category AS equipmentCategory,
    e.status AS equipmentStatus
  FROM requests r
  JOIN equipment e ON e.id = r.equipment_id
`

const requestWithStudentAndEquipmentSql = `
  SELECT
    r.id,
    r.id AS _id,
    r.status,
    r.created_at AS createdAt,
    r.updated_at AS updatedAt,
    u.id AS studentId,
    u.name AS studentName,
    u.email AS studentEmail,
    e.id AS equipmentId,
    e.name AS equipmentName,
    e.asset_code AS equipmentAssetCode,
    e.category AS equipmentCategory,
    e.status AS equipmentStatus
  FROM requests r
  JOIN users u ON u.id = r.student_id
  JOIN equipment e ON e.id = r.equipment_id
`

function parseNumericId(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }

  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1 || id > maxIntegerId) {
    return null
  }

  return id
}

function studentOnly(req, res) {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({ message: 'Student access required' })
    return false
  }

  return true
}

function shapeRequestWithEquipment(row) {
  return {
    id: row.id,
    _id: row._id,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    equipment: {
      id: row.equipmentId,
      _id: row.equipmentId,
      name: row.equipmentName,
      assetCode: row.equipmentAssetCode,
      category: row.equipmentCategory,
      status: row.equipmentStatus
    }
  }
}

function shapeRequestWithStudentAndEquipment(row) {
  return {
    id: row.id,
    _id: row._id,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    student: {
      id: row.studentId,
      _id: row.studentId,
      name: row.studentName,
      email: row.studentEmail
    },
    equipment: {
      id: row.equipmentId,
      _id: row.equipmentId,
      name: row.equipmentName,
      assetCode: row.equipmentAssetCode,
      category: row.equipmentCategory,
      status: row.equipmentStatus
    }
  }
}

async function rollbackQuietly(connection) {
  try {
    await connection.rollback()
  } catch (error) {
    // Preserve the original operation error if MySQL has already rolled back.
  }
}

async function getRequestWithEquipment(connection, requestId) {
  const [rows] = await connection.execute(
    `${requestWithEquipmentSql} WHERE r.id = ?`,
    [requestId]
  )

  return rows[0] ? shapeRequestWithEquipment(rows[0]) : null
}

async function getRequestWithStudentAndEquipment(connection, requestId) {
  const [rows] = await connection.execute(
    `${requestWithStudentAndEquipmentSql} WHERE r.id = ?`,
    [requestId]
  )

  return rows[0] ? shapeRequestWithStudentAndEquipment(rows[0]) : null
}

async function createRequest(req, res) {
  if (!studentOnly(req, res)) return

  const equipmentId = parseNumericId(String(req.body?.equipmentId ?? ''))
  if (!equipmentId) {
    return res.status(400).json({ message: 'A valid equipment ID is required' })
  }

  let connection
  let transactionStarted = false

  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    transactionStarted = true

    // Claim only AVAILABLE equipment. MySQL serializes competing updates to this row.
    const [claimResult] = await connection.execute(
      "UPDATE equipment SET status = 'REQUESTED' WHERE id = ? AND status = 'AVAILABLE'",
      [equipmentId]
    )

    if (claimResult.affectedRows === 0) {
      const [equipmentRows] = await connection.execute(
        'SELECT id FROM equipment WHERE id = ?',
        [equipmentId]
      )

      await connection.rollback()
      transactionStarted = false

      if (equipmentRows.length === 0) {
        return res.status(404).json({ message: 'Equipment not found' })
      }

      return res.status(409).json({ message: 'Equipment is no longer available.' })
    }

    const [insertResult] = await connection.execute(
      "INSERT INTO requests (student_id, equipment_id, status) VALUES (?, ?, 'PENDING')",
      [req.user.id, equipmentId]
    )
    const request = await getRequestWithEquipment(connection, insertResult.insertId)

    await connection.commit()
    transactionStarted = false

    return res.status(201).json({ request })
  } catch (error) {
    if (connection && transactionStarted) {
      await rollbackQuietly(connection)
    }

    return res.status(500).json({ message: 'Unable to create request' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

async function getMyRequests(req, res) {
  if (!studentOnly(req, res)) return

  try {
    const [rows] = await pool.execute(
      `${requestWithEquipmentSql} WHERE r.student_id = ? ORDER BY r.created_at DESC`,
      [req.user.id]
    )

    return res.json({ requests: rows.map(shapeRequestWithEquipment) })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load your requests' })
  }
}

async function cancelRequest(req, res) {
  if (!studentOnly(req, res)) return

  const requestId = parseNumericId(req.params.id)
  if (!requestId) {
    return res.status(400).json({ message: 'Invalid request ID' })
  }

  let connection
  let transactionStarted = false

  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    transactionStarted = true

    const [requestRows] = await connection.execute(
      'SELECT id, student_id, equipment_id, status FROM requests WHERE id = ? FOR UPDATE',
      [requestId]
    )
    const request = requestRows[0]

    if (!request) {
      await connection.rollback()
      transactionStarted = false
      return res.status(404).json({ message: 'Request not found' })
    }

    if (request.student_id !== req.user.id) {
      await connection.rollback()
      transactionStarted = false
      return res.status(403).json({ message: 'You can only cancel your own requests' })
    }

    if (request.status !== 'PENDING') {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Only pending requests can be cancelled' })
    }

    const [equipmentRows] = await connection.execute(
      'SELECT id, status FROM equipment WHERE id = ? FOR UPDATE',
      [request.equipment_id]
    )
    const equipment = equipmentRows[0]

    if (!equipment) {
      await connection.rollback()
      transactionStarted = false
      return res.status(404).json({ message: 'Equipment not found' })
    }

    if (equipment.status !== 'REQUESTED') {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'The equipment is not in a cancellable state' })
    }

    const [requestUpdate] = await connection.execute(
      "UPDATE requests SET status = 'CANCELLED' WHERE id = ? AND student_id = ? AND status = 'PENDING'",
      [requestId, req.user.id]
    )
    if (requestUpdate.affectedRows !== 1) {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Request could not be cancelled' })
    }

    const [equipmentUpdate] = await connection.execute(
      "UPDATE equipment SET status = 'AVAILABLE' WHERE id = ? AND status = 'REQUESTED'",
      [request.equipment_id]
    )
    if (equipmentUpdate.affectedRows !== 1) {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'The equipment is not in a cancellable state' })
    }

    const cancelledRequest = await getRequestWithEquipment(connection, requestId)
    await connection.commit()
    transactionStarted = false

    return res.json({ request: cancelledRequest })
  } catch (error) {
    if (connection && transactionStarted) {
      await rollbackQuietly(connection)
    }

    return res.status(500).json({ message: 'Unable to cancel request' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

async function getAllRequests(req, res) {
  try {
    const [rows] = await pool.execute(
      `${requestWithStudentAndEquipmentSql} ORDER BY r.created_at DESC`
    )

    return res.json({ requests: rows.map(shapeRequestWithStudentAndEquipment) })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load requests' })
  }
}

async function approveRequest(req, res) {
  return changePendingRequest(req, res, 'APPROVED')
}

async function rejectRequest(req, res) {
  return changePendingRequest(req, res, 'REJECTED')
}

async function changePendingRequest(req, res, nextStatus) {
  const requestId = parseNumericId(req.params.id)
  if (!requestId) {
    return res.status(400).json({ message: 'Invalid request ID' })
  }

  let connection
  let transactionStarted = false

  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    transactionStarted = true

    const [requestRows] = await connection.execute(
      'SELECT id, equipment_id, status FROM requests WHERE id = ? FOR UPDATE',
      [requestId]
    )
    const request = requestRows[0]

    if (!request) {
      await connection.rollback()
      transactionStarted = false
      return res.status(404).json({ message: 'Request not found' })
    }

    if (request.status !== 'PENDING') {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Only pending requests can be changed' })
    }

    const [equipmentRows] = await connection.execute(
      'SELECT id, status FROM equipment WHERE id = ? FOR UPDATE',
      [request.equipment_id]
    )
    const equipment = equipmentRows[0]

    if (!equipment) {
      await connection.rollback()
      transactionStarted = false
      return res.status(404).json({ message: 'Equipment not found' })
    }

    if (equipment.status !== 'REQUESTED') {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Equipment is not in the expected request state' })
    }

    const equipmentStatus = nextStatus === 'APPROVED' ? 'BORROWED' : 'AVAILABLE'
    const [requestUpdate] = await connection.execute(
      'UPDATE requests SET status = ? WHERE id = ? AND status = ?',
      [nextStatus, requestId, 'PENDING']
    )
    if (requestUpdate.affectedRows !== 1) {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Request state has changed' })
    }

    const [equipmentUpdate] = await connection.execute(
      "UPDATE equipment SET status = ? WHERE id = ? AND status = 'REQUESTED'",
      [equipmentStatus, request.equipment_id]
    )
    if (equipmentUpdate.affectedRows !== 1) {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Equipment state has changed' })
    }

    const changedRequest = await getRequestWithStudentAndEquipment(connection, requestId)
    await connection.commit()
    transactionStarted = false

    return res.json({ request: changedRequest })
  } catch (error) {
    if (connection && transactionStarted) {
      await rollbackQuietly(connection)
    }

    return res.status(500).json({ message: 'Unable to update request' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

async function returnRequest(req, res) {
  const requestId = parseNumericId(req.params.id)
  if (!requestId) {
    return res.status(400).json({ message: 'Invalid request ID' })
  }

  let connection
  let transactionStarted = false

  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    transactionStarted = true

    const [requestRows] = await connection.execute(
      'SELECT id, equipment_id, status FROM requests WHERE id = ? FOR UPDATE',
      [requestId]
    )
    const request = requestRows[0]

    if (!request) {
      await connection.rollback()
      transactionStarted = false
      return res.status(404).json({ message: 'Request not found' })
    }

    if (request.status !== 'APPROVED') {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Only approved borrowed requests can be returned' })
    }

    const [equipmentRows] = await connection.execute(
      'SELECT id, status FROM equipment WHERE id = ? FOR UPDATE',
      [request.equipment_id]
    )
    const equipment = equipmentRows[0]

    if (!equipment) {
      await connection.rollback()
      transactionStarted = false
      return res.status(404).json({ message: 'Equipment not found' })
    }

    if (equipment.status !== 'BORROWED') {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Equipment is not in the expected borrowed state' })
    }

    const [requestUpdate] = await connection.execute(
      "UPDATE requests SET status = 'RETURNED' WHERE id = ? AND status = 'APPROVED'",
      [requestId]
    )
    if (requestUpdate.affectedRows !== 1) {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Request state has changed' })
    }

    const [equipmentUpdate] = await connection.execute(
      "UPDATE equipment SET status = 'AVAILABLE' WHERE id = ? AND status = 'BORROWED'",
      [request.equipment_id]
    )
    if (equipmentUpdate.affectedRows !== 1) {
      await connection.rollback()
      transactionStarted = false
      return res.status(409).json({ message: 'Equipment state has changed' })
    }

    const returnedRequest = await getRequestWithStudentAndEquipment(connection, requestId)
    await connection.commit()
    transactionStarted = false

    return res.json({ request: returnedRequest })
  } catch (error) {
    if (connection && transactionStarted) {
      await rollbackQuietly(connection)
    }

    return res.status(500).json({ message: 'Unable to return request' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  cancelRequest,
  getAllRequests,
  approveRequest,
  rejectRequest,
  returnRequest
}
