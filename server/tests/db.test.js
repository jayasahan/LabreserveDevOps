const mongoose = require('mongoose')
const connectDatabase = require('../config/db')

describe('local database connections', () => {
  const originalUri = process.env.MONGODB_URI
  beforeEach(() => {
    jest.spyOn(mongoose, 'connect').mockResolvedValue(undefined)
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    if (originalUri === undefined) delete process.env.MONGODB_URI
    else process.env.MONGODB_URI = originalUri
    jest.restoreAllMocks()
  })

  test.each([
    'mongodb://database:27017/labreserve',
    'mongodb://localhost:27018/labreserve',
    'mongodb://127.0.0.1:27018/labreserve',
    'mongodb://[::1]:27018/labreserve'
  ])('accepts %s', async uri => {
    process.env.MONGODB_URI = uri
    await connectDatabase()
    expect(mongoose.connect).toHaveBeenCalledWith(uri, expect.any(Object))
  })

  test.each([
    'mongodb+srv://example.invalid/labreserve',
    'mongodb://example.invalid/labreserve',
    'mongodb://localhost.example.invalid/labreserve',
    'mongodb://localhost:27018,example.invalid/labreserve'
  ])('rejects remote configuration before connecting: %s', async uri => {
    process.env.MONGODB_URI = uri
    await expect(connectDatabase()).rejects.toThrow('local labreserve')
    expect(mongoose.connect).not.toHaveBeenCalled()
  })
})
