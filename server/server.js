const express = require('express')
const cors = require('cors')
const path = require('path')
const pool = require('./config/mysql')
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

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '..', 'client', 'dist')

  app.use(express.static(clientDistPath))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return next()
    }

    return res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

async function startServer() {
  try {
    await pool.query('SELECT 1')
    console.log('MySQL connected')

    app.listen(PORT, HOST, () => {
      console.log(`LabReserve API running on port ${PORT}`)
    })
  } catch (error) {
    console.error('MySQL connection failed')
    process.exitCode = 1
  }
}

startServer()
