jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}))
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}))

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { register } = require('../controllers/authController')

describe('register', () => {
  let response
  const originalJwtSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret'
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = originalJwtSecret
    }
    jest.clearAllMocks()
  })

  test('hashes the password and always registers students', async () => {
    const user = {
      _id: { toString: () => 'user-id' },
      name: 'Taylor Student',
      email: 'taylor@example.com',
      password: 'hashed-password',
      role: 'STUDENT',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    }
    User.findOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashed-password')
    User.create.mockResolvedValue(user)
    jwt.sign.mockReturnValue('signed-token')

    await register(
      {
        body: {
          name: user.name,
          email: user.email,
          password: 'plain-password',
          role: 'ADMIN',
        },
      },
      response,
    )

    expect(User.findOne).toHaveBeenCalledWith({ email: user.email })
    expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10)
    expect(User.create).toHaveBeenCalledWith({
      name: user.name,
      email: user.email,
      password: 'hashed-password',
      role: 'STUDENT',
    })
    expect(response.status).toHaveBeenCalledWith(201)
    expect(response.json).toHaveBeenCalledWith({
      token: 'signed-token',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'STUDENT',
        createdAt: user.createdAt,
      },
    })
  })

  test('returns a conflict for an existing email without creating a user', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing-user' })

    await register(
      { body: { name: 'Taylor', email: 'taylor@example.com', password: 'password' } },
      response,
    )

    expect(User.create).not.toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(409)
  })
})
