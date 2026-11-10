const { MongoClient } = require('mongodb')

const BATCH_SIZE = 500
const MARKER_DATABASE = 'labreserve_metadata'
const MARKER_COLLECTION = 'initialization'
const MARKER_ID = 'remote-database-copy-v1'

function collectionOptions(collectionInfo) {
  const options = { ...collectionInfo.options }
  delete options.uuid
  return options
}

function indexOptions(index) {
  const { key, name, ns, v, background, ...options } = index
  return { key, options: { ...options, name } }
}

async function copyDocuments(sourceCollection, targetCollection) {
  const cursor = sourceCollection.find().batchSize(BATCH_SIZE)
  let batch = []
  let copiedCount = 0

  for await (const document of cursor) {
    batch.push(document)
    if (batch.length === BATCH_SIZE) {
      await targetCollection.insertMany(batch)
      copiedCount += batch.length
      batch = []
    }
  }

  if (batch.length > 0) {
    await targetCollection.insertMany(batch)
    copiedCount += batch.length
  }

  return copiedCount
}

async function copyDatabase(sourceDatabase, targetDatabase) {
  const collectionInfos = await sourceDatabase
    .listCollections({}, { nameOnly: false })
    .toArray()
  const dataCollections = collectionInfos.filter(
    ({ name, type }) => !name.startsWith('system.') && type !== 'view',
  )
  const views = collectionInfos.filter(({ type }) => type === 'view')

  for (const info of dataCollections) {
    const targetCollection = await targetDatabase.createCollection(
      info.name,
      collectionOptions(info),
    )
    const sourceCollection = sourceDatabase.collection(info.name)
    const copiedCount = await copyDocuments(sourceCollection, targetCollection)

    const indexes = await sourceCollection.indexes()
    for (const index of indexes) {
      if (index.name === '_id_') continue
      const { key, options } = indexOptions(index)
      await targetCollection.createIndex(key, options)
    }

    console.log(`Copied ${info.name}: ${copiedCount} documents`)
  }

  for (const info of views) {
    await targetDatabase.createCollection(info.name, collectionOptions(info))
    console.log(`Created view ${info.name}`)
  }
}

async function initializeLocalDatabase() {
  const localUri = process.env.MONGODB_LOCAL_URI
  const localDatabaseName = process.env.MONGODB_LOCAL_DATABASE

  if (!localUri || !localDatabaseName) {
    throw new Error('Local MongoDB connection settings are missing')
  }

  const localClient = new MongoClient(localUri)

  try {
    await localClient.connect()
    const localDatabase = localClient.db(localDatabaseName)
    const markerCollection = localClient
      .db(MARKER_DATABASE)
      .collection(MARKER_COLLECTION)
    const completedInitialization = await markerCollection.findOne({ _id: MARKER_ID })

    if (completedInitialization) {
      console.log('Initial remote database copy already completed; keeping local data')
      return
    }

    const existingCollections = await localDatabase
      .listCollections({}, { nameOnly: true })
      .toArray()
    if (existingCollections.length > 0) {
      throw new Error(
        'The local database is not empty and has no initialization marker. Back up or remove the local MongoDB volume before retrying.',
      )
    }

    const sourceUri = process.env.MONGODB_SOURCE_URI
    const sourceDatabaseName = process.env.MONGODB_SOURCE_DATABASE
    if (!sourceUri || !sourceDatabaseName) {
      throw new Error(
        'MONGODB_SOURCE_URI and MONGODB_SOURCE_DATABASE are required for the initial copy',
      )
    }

    const sourceClient = new MongoClient(sourceUri)
    try {
      await sourceClient.connect()
      await copyDatabase(sourceClient.db(sourceDatabaseName), localDatabase)
      await markerCollection.insertOne({
        _id: MARKER_ID,
        sourceDatabase: sourceDatabaseName,
        targetDatabase: localDatabaseName,
        completedAt: new Date(),
      })
      console.log('Initial remote database copy completed')
    } catch (error) {
      await localDatabase.dropDatabase()
      throw error
    } finally {
      await sourceClient.close()
    }
  } finally {
    await localClient.close()
  }
}

if (require.main === module) {
  initializeLocalDatabase().catch((error) => {
    const sourceUri = process.env.MONGODB_SOURCE_URI
    const message = sourceUri
      ? error.message.replaceAll(sourceUri, '[redacted MongoDB source URI]')
      : error.message
    console.error(`Local MongoDB initialization failed: ${message}`)
    process.exitCode = 1
  })
}

module.exports = { copyDatabase, initializeLocalDatabase }
