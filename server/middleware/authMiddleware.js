const jwt = require('jsonwebtoken')
const pool = require('../config/mysql')

async function requireAuthentication(req, res, next) {
  try {
    const authorization = req.headers.authorization || ''
    const [scheme, token] = authorization.split(' ')

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Authentication is not configured' })
    }

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    if (!Number.isSafeInteger(payload.userId) || payload.userId < 1) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at AS createdAt FROM users WHERE id = ?',
      [payload.userId]
    )
    const user = users[0]

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    req.user = user
    return next()
  } catch (error) {
    return res.status(500).json({ message: 'Unable to authenticate at this time' })
  }
}

module.exports = requireAuthentication
