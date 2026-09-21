const express = require('express')
const { register, login, getCurrentUser } = require('../controllers/authController')
const requireAuthentication = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuthentication, getCurrentUser)

module.exports = router
