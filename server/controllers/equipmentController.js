const mongoose = require('mongoose')
const Equipment = require('../models/Equipment')

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function validationError(error) {
  return error.name === 'ValidationError'
}

async function getEquipment(req, res) {
  try {
    const { search, category } = req.query
    const filter = {}

    if (search && search.trim()) {
      const searchValue = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { name: { $regex: searchValue, $options: 'i' } },
        { assetCode: { $regex: searchValue, $options: 'i' } }
      ]
    }

    if (category && category.trim()) {
      filter.category = category.trim()
    }

    const equipment = await Equipment.find(filter).sort({ createdAt: -1 })
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
    const equipment = await Equipment.findById(req.params.id)
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' })
    }

    return res.json({ equipment })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load equipment' })
  }
}

async function createEquipment(req, res) {
  const { name, category, assetCode, description } = req.body

  try {
    const equipment = await Equipment.create({
      name,
      category,
      assetCode,
      description,
      status: 'AVAILABLE'
    })

    return res.status(201).json({ equipment })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An equipment item with that asset code already exists' })
    }
    if (validationError(error)) {
      return res.status(400).json({ message: 'Please provide valid equipment details' })
    }

    return res.status(500).json({ message: 'Unable to create equipment' })
  }
}

async function updateEquipment(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' })
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
    return res.status(400).json({ message: 'Equipment status is managed by the request workflow' })
  }

  const updates = {}
  for (const field of ['name', 'category', 'assetCode', 'description']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No editable equipment fields were provided' })
  }

  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    })

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' })
    }

    return res.json({ equipment })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An equipment item with that asset code already exists' })
    }
    if (validationError(error)) {
      return res.status(400).json({ message: 'Please provide valid equipment details' })
    }

    return res.status(500).json({ message: 'Unable to update equipment' })
  }
}

async function deleteEquipment(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' })
  }

  try {
    const equipment = await Equipment.findById(req.params.id)
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' })
    }

    if (['REQUESTED', 'BORROWED'].includes(equipment.status)) {
      return res.status(409).json({ message: 'Requested or borrowed equipment cannot be deleted' })
    }

    await Equipment.deleteOne({ _id: equipment._id })
    return res.json({ message: 'Equipment deleted' })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete equipment' })
  }
}

module.exports = { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment }
