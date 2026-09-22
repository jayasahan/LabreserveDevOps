const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/mysql')

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing')
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  }
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body || {}

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedName.length > 100 || normalizedEmail.length > 255) {
      return res.status(400).json({ message: 'Name or email is too long' })
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with that email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const [insertResult] = await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'STUDENT')",
      [normalizedName, normalizedEmail, hashedPassword]
    )

    const [createdUsers] = await pool.execute(
      'SELECT id, name, email, role, created_at AS createdAt FROM users WHERE id = ?',
      [insertResult.insertId]
    )
    const user = createdUsers[0]
    const token = createToken(user.id)

    return res.status(201).json({ token, user: publicUser(user) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({ message: 'An account with that email already exists' })
    }

    return res.status(500).json({ message: 'Unable to register at this time' })
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {}

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, created_at AS createdAt FROM users WHERE email = ?',
      [normalizedEmail]
    )
    const user = users[0]
    const passwordMatches = user && await bcrypt.compare(password, user.password)

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = createToken(user.id)
    return res.json({ token, user: publicUser(user) })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to log in at this time' })
  }
}

function getCurrentUser(req, res) {
  return res.json({ user: publicUser(req.user) })
}

module.exports = { register, login, getCurrentUser }
