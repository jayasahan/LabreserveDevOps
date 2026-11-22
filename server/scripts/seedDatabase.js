require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const connectDatabase = require('../config/db')
const User = require('../models/User')
const seedAdmin = require('./seedAdmin')
const seedEquipment = require('./seedEquipment')

const students = [
  { name: 'Nimal Perera', email: 'student1@example.com' },
  { name: 'Amaya Silva', email: 'student2@example.com' }
]

async function seedDatabase() {
  const initialization = mongoose.connection.collection('initialization')
  const marker = { _id: 'local-seed-v1' }
  if (await initialization.findOne(marker)) {
    console.log('Local seed already completed; keeping existing data')
    return
  }

  const password = process.env.STUDENT_PASSWORD
  if (!password || password.length < 6) {
    throw new Error('STUDENT_PASSWORD must be at least 6 characters')
  }
  if (students.some(student => student.email === process.env.ADMIN_EMAIL?.toLowerCase().trim())) {
    throw new Error('ADMIN_EMAIL must differ from the sample student emails')
  }

  // Each step skips existing records so an interrupted first seed can safely retry.
  await seedAdmin({ updateExisting: false })
  for (const student of students) {
    const existing = await User.findOne({ email: student.email })
    if (existing) {
      if (existing.role !== 'STUDENT') throw new Error('Sample student email belongs to an admin')
      continue
    }
    await User.create({ ...student, password: await bcrypt.hash(password, 10), role: 'STUDENT' })
  }
  await seedEquipment()

  // Write this last: future starts must not restore deleted items or reset user changes.
  await initialization.updateOne(marker, { $set: { completedAt: new Date() } }, { upsert: true })
  console.log('Local database seed completed')
}

async function main() {
  try {
    await connectDatabase()
    await seedDatabase()
  } catch (error) {
    console.error('Local seed failed; check local database and seed settings')
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

if (require.main === module) main()

module.exports = seedDatabase
