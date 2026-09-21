const pool = require('../config/mysql')

async function testMysqlConnection() {
  let connection

  try {
    connection = await pool.getConnection()
    await connection.query('SELECT 1')
    console.log('MySQL connection successful')
  } catch (error) {
    // Driver errors can include connection details, so keep this message generic.
    console.error('MySQL connection failed')
    process.exitCode = 1
  } finally {
    if (connection) {
      connection.release()
    }

    await pool.end()
  }
}

testMysqlConnection()
