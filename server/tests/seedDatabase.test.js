const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Equipment = require('../models/Equipment')
const seedDatabase = require('../scripts/seedDatabase')

describe('local database seed', () => {
  let users, equipment, marker, initialization
  const originalEnv = { ...process.env }

  beforeEach(() => {
    Object.assign(process.env, {
      ADMIN_NAME: 'Administrator', ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'admin-password', STUDENT_PASSWORD: 'student-password'
    })
    users = []
    equipment = []
    marker = null
    initialization = {
      findOne: jest.fn(async () => marker),
      updateOne: jest.fn(async () => { marker = { completedAt: new Date() } })
    }
    jest.spyOn(mongoose.connection, 'collection').mockReturnValue(initialization)
    jest.spyOn(User, 'findOne').mockImplementation(async ({ email }) => users.find(user => user.email === email))
    jest.spyOn(User, 'create').mockImplementation(async record => {
      await new User(record).validate()
      users.push(record)
      return record
    })
    jest.spyOn(Equipment, 'exists').mockImplementation(async ({ assetCode }) => equipment.find(item => item.assetCode === assetCode))
    jest.spyOn(Equipment, 'create').mockImplementation(async record => {
      await new Equipment(record).validate()
      equipment.push(record)
      return record
    })
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  test('creates valid local accounts with hashed passwords and available equipment', async () => {
    await seedDatabase()
    expect(users.map(user => user.role)).toEqual(['ADMIN', 'STUDENT', 'STUDENT'])
    for (const user of users) {
      const password = user.role === 'ADMIN' ? 'admin-password' : 'student-password'
      expect(user.password).not.toBe(password)
      expect(await bcrypt.compare(password, user.password)).toBe(true)
    }
    expect(equipment).toHaveLength(12)
    expect(equipment.every(item => item.status === 'AVAILABLE')).toBe(true)
    expect(new Set(equipment.map(item => item.assetCode)).size).toBe(12)
    expect(marker).not.toBeNull()
  })

  test('restart preserves edited accounts, request-related statuses, and deleted equipment', async () => {
    await seedDatabase()
    users[0].password = 'changed-hash'
    equipment[0].status = 'BORROWED'
    equipment.pop()
    await seedDatabase()
    expect(users).toHaveLength(3)
    expect(users[0].password).toBe('changed-hash')
    expect(equipment).toHaveLength(11)
    expect(equipment[0].status).toBe('BORROWED')
    expect(initialization.updateOne).toHaveBeenCalledTimes(1)
  })

  test('retries an interrupted seed without duplicates or overwriting existing records', async () => {
    Equipment.create.mockRejectedValueOnce(new Error('Interrupted'))
    await expect(seedDatabase()).rejects.toThrow('Interrupted')
    expect(marker).toBeNull()
    const adminHash = users[0].password
    await seedDatabase()
    expect(users).toHaveLength(3)
    expect(users[0].password).toBe(adminHash)
    expect(equipment).toHaveLength(12)
    expect(marker).not.toBeNull()
  })

  test('rejects invalid student settings before creating anything', async () => {
    process.env.STUDENT_PASSWORD = 'short'
    await expect(seedDatabase()).rejects.toThrow('STUDENT_PASSWORD')
    expect(User.create).not.toHaveBeenCalled()
    expect(marker).toBeNull()
  })

  test('does not promote a student who has the configured admin email', async () => {
    users.push({ email: 'admin@example.com', role: 'STUDENT' })
    await expect(seedDatabase()).rejects.toThrow('non-admin')
    expect(users[0].role).toBe('STUDENT')
    expect(marker).toBeNull()
  })
})
