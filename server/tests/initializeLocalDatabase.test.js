jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}))

const { MongoClient } = require('mongodb')
const {
  copyDatabase,
  initializeLocalDatabase,
} = require('../scripts/initializeLocalDatabase')

describe('copyDatabase', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    MongoClient.mockReset()
  })

  test('copies documents, indexes, and views to the local database', async () => {
    const sourceCollection = {
      find: jest.fn(() => ({
        batchSize: jest.fn().mockReturnThis(),
        async *[Symbol.asyncIterator]() {
          yield { _id: 'user-1', email: 'student@example.com' }
          yield { _id: 'user-2', email: 'admin@example.com' }
        },
      })),
      indexes: jest.fn().mockResolvedValue([
        { name: '_id_', key: { _id: 1 } },
        {
          name: 'email_1',
          key: { email: 1 },
          unique: true,
          ns: 'source.users',
          v: 2,
        },
      ]),
    }
    const targetCollection = {
      insertMany: jest.fn().mockResolvedValue({}),
      createIndex: jest.fn().mockResolvedValue('email_1'),
    }
    const sourceDatabase = {
      listCollections: jest.fn(() => ({
        toArray: jest.fn().mockResolvedValue([
          {
            name: 'users',
            type: 'collection',
            options: { validator: { email: { $type: 'string' } } },
          },
          {
            name: 'users_view',
            type: 'view',
            options: { viewOn: 'users', pipeline: [] },
          },
          { name: 'system.users', type: 'collection', options: {} },
        ]),
      })),
      collection: jest.fn().mockReturnValue(sourceCollection),
    }
    const targetDatabase = {
      createCollection: jest.fn().mockResolvedValue(targetCollection),
    }
    jest.spyOn(console, 'log').mockImplementation(() => {})

    await copyDatabase(sourceDatabase, targetDatabase)

    expect(targetDatabase.createCollection).toHaveBeenNthCalledWith(1, 'users', {
      validator: { email: { $type: 'string' } },
    })
    expect(targetCollection.insertMany).toHaveBeenCalledWith([
      { _id: 'user-1', email: 'student@example.com' },
      { _id: 'user-2', email: 'admin@example.com' },
    ])
    expect(targetCollection.createIndex).toHaveBeenCalledWith(
      { email: 1 },
      { unique: true, name: 'email_1' },
    )
    expect(targetDatabase.createCollection).toHaveBeenNthCalledWith(2, 'users_view', {
      viewOn: 'users',
      pipeline: [],
    })
    expect(sourceDatabase.collection).toHaveBeenCalledTimes(1)
  })
})

describe('initializeLocalDatabase', () => {
  afterEach(() => {
    delete process.env.MONGODB_LOCAL_URI
    delete process.env.MONGODB_LOCAL_DATABASE
    delete process.env.MONGODB_SOURCE_URI
    delete process.env.MONGODB_SOURCE_DATABASE
    jest.restoreAllMocks()
    MongoClient.mockReset()
  })

  test('does not connect to Atlas after the initial copy marker exists', async () => {
    const markerCollection = {
      findOne: jest.fn().mockResolvedValue({ _id: 'remote-database-copy-v1' }),
    }
    const localDatabase = {
      listCollections: jest.fn(),
    }
    const markerDatabase = {
      collection: jest.fn().mockReturnValue(markerCollection),
    }
    const localClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      db: jest.fn((name) =>
        name === 'labreserve' ? localDatabase : markerDatabase,
      ),
      close: jest.fn().mockResolvedValue(undefined),
    }
    MongoClient.mockImplementation(() => localClient)
    process.env.MONGODB_LOCAL_URI = 'mongodb://database:27017/labreserve'
    process.env.MONGODB_LOCAL_DATABASE = 'labreserve'
    delete process.env.MONGODB_SOURCE_URI
    delete process.env.MONGODB_SOURCE_DATABASE
    jest.spyOn(console, 'log').mockImplementation(() => {})

    await initializeLocalDatabase()

    expect(MongoClient).toHaveBeenCalledTimes(1)
    expect(markerCollection.findOne).toHaveBeenCalledWith({
      _id: 'remote-database-copy-v1',
    })
    expect(localDatabase.listCollections).not.toHaveBeenCalled()
    expect(localClient.close).toHaveBeenCalled()
  })
})
