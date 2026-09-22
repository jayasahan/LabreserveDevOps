require('dotenv').config()

const bcrypt = require('bcryptjs')
const pool = require('../config/mysql')

async function seedAdmin() {
  const adminName = process.env.ADMIN_NAME
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminName || !adminEmail || !adminPassword) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required')
  }

  const normalizedEmail = adminEmail.toLowerCase().trim()
  const [existingUsers] = await pool.execute(
    'SELECT id, role FROM users WHERE email = ?',
    [normalizedEmail]
  )
  const existingUser = existingUsers[0]

  if (existingUser) {
    if (existingUser.role !== 'ADMIN') {
      throw new Error('The configured admin email belongs to a non-admin account')
    }

    console.log('Admin account already exists')
    return
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  await pool.execute(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'ADMIN')",
    [adminName.trim(), normalizedEmail, hashedPassword]
  )

  console.log('Admin account created')
}

async function main() {
  try {
    await seedAdmin()
  } catch (error) {
    console.error('Admin seed failed')
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
