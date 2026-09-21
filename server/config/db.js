const mongoose = require('mongoose')

function sanitizeErrorMessage(message) {
  return String(message || 'Unknown MongoDB connection error')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"`]+/gi, '[redacted MongoDB URI]')
    .replace(/([a-z0-9._-]+):([^@\s]+)@/gi, '[redacted credentials]@')
}

async function connectDatabase() {
  const mongodbUri = process.env.MONGODB_URI

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is missing')
  }

  try {
    await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 5000 })
    console.log('MongoDB connected')
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('MongoDB connection diagnostics:', {
        name: error.name || 'UnknownError',
        code: error.code || undefined,
        syscall: error.syscall || undefined,
        hostname: error.hostname || error.host || undefined,
        message: sanitizeErrorMessage(error.message)
      })
    }

    throw error
  }
}

module.exports = connectDatabase
