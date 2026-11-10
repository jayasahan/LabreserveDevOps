require('dotenv').config()

const bcrypt = require('bcryptjs')
const connectDatabase = require('../config/db')
const User = require('../models/User')

async function seedAdmin() {
  const adminName = process.env.ADMIN_NAME
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminName || !adminEmail || !adminPassword) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required')
  }

  const normalizedEmail = adminEmail.toLowerCase().trim()
  const existingUser = await User.findOne({ email: normalizedEmail })

  if (existingUser) {
    console.log('Admin account already exists')
    return
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  await User.create({
    name: adminName,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'ADMIN'
  })

  console.log('Admin account created')
}

async function main() {
  try {
    await connectDatabase()
    await seedAdmin()
  } catch (error) {
    console.error('Admin seed failed')
    process.exitCode = 1
  } finally {
    const mongoose = require('mongoose')
    await mongoose.disconnect()
  }
}

main()
