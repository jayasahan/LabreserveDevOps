const express = require('express')
const cors = require('cors')
const connectDatabase = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const equipmentRoutes = require('./routes/equipmentRoutes')
const requestRoutes = require('./routes/requestRoutes')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/requests', requestRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'LabReserve API' })
})

async function startServer() {
  try {
    await connectDatabase()

    app.listen(PORT, HOST, () => {
      console.log(`LabReserve API running on port ${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed')
    process.exitCode = 1
  }
}

startServer()
