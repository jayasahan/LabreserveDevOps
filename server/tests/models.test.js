const mongoose = require('mongoose')
const User = require('../models/User')
const Equipment = require('../models/Equipment')
const Request = require('../models/Request')

describe('User model', () => {
  test('valid user document passes validation', async () => {
    const user = new User({
      name: 'Taylor Student',
      email: 'taylor@example.com',
      password: 'secure-password',
    })

    await expect(user.validate()).resolves.toBeUndefined()
  })

  test('missing required fields fail validation', async () => {
    await expect(new User({}).validate()).rejects.toMatchObject({
      name: 'ValidationError',
      errors: expect.objectContaining({
        name: expect.any(Object),
        email: expect.any(Object),
        password: expect.any(Object),
      }),
    })
  })

  test('defaults role to STUDENT', () => {
    const user = new User()

    expect(user.role).toBe('STUDENT')
  })

  test('rejects an invalid role', async () => {
    const user = new User({
      name: 'Taylor Student',
      email: 'taylor@example.com',
      password: 'secure-password',
      role: 'LAB_MANAGER',
    })

    await expect(user.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ role: expect.any(Object) }),
    })
  })
})

describe('Equipment model', () => {
  test('valid equipment document passes validation', async () => {
    const equipment = new Equipment({
      name: 'Oscilloscope',
      category: 'Electronics',
      assetCode: 'SCOPE-001',
      description: 'Digital oscilloscope',
    })

    await expect(equipment.validate()).resolves.toBeUndefined()
  })

  test('missing required fields fail validation', async () => {
    await expect(new Equipment({}).validate()).rejects.toMatchObject({
      name: 'ValidationError',
      errors: expect.objectContaining({
        name: expect.any(Object),
        category: expect.any(Object),
        assetCode: expect.any(Object),
        description: expect.any(Object),
      }),
    })
  })

  test('defaults status to AVAILABLE', () => {
    const equipment = new Equipment()

    expect(equipment.status).toBe('AVAILABLE')
  })

  test('rejects an invalid status', async () => {
    const equipment = new Equipment({
      name: 'Oscilloscope',
      category: 'Electronics',
      assetCode: 'SCOPE-001',
      description: 'Digital oscilloscope',
      status: 'IN_REPAIR',
    })

    await expect(equipment.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ status: expect.any(Object) }),
    })
  })
})

describe('Request model', () => {
  test('valid request with ObjectId references passes validation', async () => {
    const request = new Request({
      student: new mongoose.Types.ObjectId(),
      equipment: new mongoose.Types.ObjectId(),
    })

    await expect(request.validate()).resolves.toBeUndefined()
  })

  test('missing required references fail validation', async () => {
    await expect(new Request({}).validate()).rejects.toMatchObject({
      name: 'ValidationError',
      errors: expect.objectContaining({
        student: expect.any(Object),
        equipment: expect.any(Object),
      }),
    })
  })

  test('defaults status to PENDING', () => {
    const request = new Request()

    expect(request.status).toBe('PENDING')
  })

  test('rejects an invalid status', async () => {
    const request = new Request({
      student: new mongoose.Types.ObjectId(),
      equipment: new mongoose.Types.ObjectId(),
      status: 'WAITING',
    })

    await expect(request.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ status: expect.any(Object) }),
    })
  })
})
