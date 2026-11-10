const mongoose = require('mongoose')
const Equipment = require('../models/Equipment')
const Request = require('../models/Request')

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function studentOnly(req, res) {
  if (req.user.role !== 'STUDENT') {
    res.status(403).json({ message: 'Student access required' })
    return false
  }
  return true
}

function populateEquipment(query) {
  return query.populate('equipment', 'name assetCode category status')
}

function populateRequest(query) {
  return query
    .populate('student', 'name email')
    .populate('equipment', 'name assetCode category status')
}

async function createRequest(req, res) {
  if (!studentOnly(req, res)) return

  const { equipmentId } = req.body
  if (!equipmentId || !isValidId(equipmentId)) {
    return res.status(400).json({ message: 'A valid equipment ID is required' })
  }

  try {
    // MongoDB checks the ID and availability in one operation, so only one requester can claim the item.
    const claimedEquipment = await Equipment.findOneAndUpdate(
      { _id: equipmentId, status: 'AVAILABLE' },
      { $set: { status: 'REQUESTED' } },
      { new: true },
    )

    if (!claimedEquipment) {
      const equipmentExists = await Equipment.exists({ _id: equipmentId })
      if (!equipmentExists) {
        return res.status(404).json({ message: 'Equipment not found' })
      }
      return res.status(409).json({ message: 'Equipment is no longer available.' })
    }

    try {
      const request = await Request.create({
        student: req.user._id,
        equipment: claimedEquipment._id,
        status: 'PENDING'
      })
      const populatedRequest = await populateEquipment(Request.findById(request._id))
      return res.status(201).json({ request: populatedRequest })
    } catch (error) {
      await Equipment.updateOne(
        { _id: claimedEquipment._id, status: 'REQUESTED' },
        { $set: { status: 'AVAILABLE' } },
      )
      throw error
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Unable to create a valid request' })
    }
    return res.status(500).json({ message: 'Unable to create request' })
  }
}

async function getMyRequests(req, res) {
  if (!studentOnly(req, res)) return

  try {
    const requests = await populateEquipment(
      Request.find({ student: req.user._id }).sort({ createdAt: -1 }),
    )
    return res.json({ requests })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load your requests' })
  }
}

async function cancelRequest(req, res) {
  if (!studentOnly(req, res)) return
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid request ID' })
  }

  try {
    const request = await Request.findById(req.params.id)
    if (!request) return res.status(404).json({ message: 'Request not found' })
    if (request.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own requests' })
    }
    if (request.status !== 'PENDING') {
      return res.status(409).json({ message: 'Only pending requests can be cancelled' })
    }

    const releasedEquipment = await Equipment.findOneAndUpdate(
      { _id: request.equipment, status: 'REQUESTED' },
      { $set: { status: 'AVAILABLE' } },
      { new: true },
    )
    if (!releasedEquipment) {
      return res.status(409).json({ message: 'The equipment is not in a cancellable state' })
    }

    const cancelledRequest = await Request.findOneAndUpdate(
      { _id: request._id, student: req.user._id, status: 'PENDING' },
      { $set: { status: 'CANCELLED' } },
      { new: true },
    )
    if (!cancelledRequest) {
      await Equipment.updateOne({ _id: request.equipment, status: 'AVAILABLE' }, { $set: { status: 'REQUESTED' } })
      return res.status(409).json({ message: 'Request could not be cancelled' })
    }

    return res.json({ request: await populateEquipment(Request.findById(cancelledRequest._id)) })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to cancel request' })
  }
}

async function getAllRequests(req, res) {
  try {
    const requests = await populateRequest(Request.find().sort({ createdAt: -1 }))
    return res.json({ requests })
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
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid request ID' })
  }

  try {
    const request = await Request.findById(req.params.id).populate('equipment', 'name assetCode category status')
    if (!request) return res.status(404).json({ message: 'Request not found' })
    if (request.status !== 'PENDING') {
      return res.status(409).json({ message: 'Only pending requests can be changed' })
    }
    if (!request.equipment || request.equipment.status !== 'REQUESTED') {
      return res.status(409).json({ message: 'Equipment is not in the expected request state' })
    }

    const equipmentStatus = nextStatus === 'APPROVED' ? 'BORROWED' : 'AVAILABLE'
    const changedEquipment = await Equipment.findOneAndUpdate(
      { _id: request.equipment._id, status: 'REQUESTED' },
      { $set: { status: equipmentStatus } },
      { new: true },
    )
    if (!changedEquipment) {
      return res.status(409).json({ message: 'Equipment state has changed' })
    }

    const changedRequest = await Request.findOneAndUpdate(
      { _id: request._id, status: 'PENDING' },
      { $set: { status: nextStatus } },
      { new: true },
    )
    if (!changedRequest) {
      await Equipment.updateOne({ _id: request.equipment._id, status: equipmentStatus }, { $set: { status: 'REQUESTED' } })
      return res.status(409).json({ message: 'Request state has changed' })
    }

    return res.json({ request: await populateRequest(Request.findById(changedRequest._id)) })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update request' })
  }
}

async function returnRequest(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid request ID' })
  }

  try {
    const request = await Request.findById(req.params.id).populate('equipment', 'name assetCode category status')
    if (!request) return res.status(404).json({ message: 'Request not found' })
    if (request.status !== 'APPROVED' || !request.equipment || request.equipment.status !== 'BORROWED') {
      return res.status(409).json({ message: 'Only approved borrowed requests can be returned' })
    }

    const releasedEquipment = await Equipment.findOneAndUpdate(
      { _id: request.equipment._id, status: 'BORROWED' },
      { $set: { status: 'AVAILABLE' } },
      { new: true },
    )
    if (!releasedEquipment) return res.status(409).json({ message: 'Equipment state has changed' })

    const returnedRequest = await Request.findOneAndUpdate(
      { _id: request._id, status: 'APPROVED' },
      { $set: { status: 'RETURNED' } },
      { new: true },
    )
    if (!returnedRequest) {
      await Equipment.updateOne({ _id: request.equipment._id, status: 'AVAILABLE' }, { $set: { status: 'BORROWED' } })
      return res.status(409).json({ message: 'Request state has changed' })
    }

    return res.json({ request: await populateRequest(Request.findById(returnedRequest._id)) })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to return request' })
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
