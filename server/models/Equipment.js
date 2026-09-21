const mongoose = require('mongoose')

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
      minlength: [2, 'Equipment name must be at least 2 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    assetCode: {
      type: String,
      required: [true, 'Asset code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'REQUESTED', 'BORROWED'],
      default: 'AVAILABLE'
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Equipment', equipmentSchema)
