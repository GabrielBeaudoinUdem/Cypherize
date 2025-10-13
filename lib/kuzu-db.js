const kuzu = require('kuzu');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'kuzu_database');
let cachedDb = null;

async function initializeDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const db = new kuzu.Database(DB_PATH);
    const connection = new kuzu.Connection(db);
    cachedDb = { db, connection };
    return cachedDb;
  } catch (e) {
      console.error("Erreur initialisation Kuzu:", e);
      throw e;
  }
}

async function executeCypherQuery(query) {
  const { connection } = await initializeDatabase();
  
  try {
    const preparedStatement = await connection.prepare(query);
    const queryResult = await connection.execute(preparedStatement);
    const result = await queryResult.getAll();
    return result;
  } catch (error) {
    console.error("Erreur exécution de la requête:", error);
    throw new Error(error.message);
  }
}

module.exports = {
  initializeDatabase,
  executeCypherQuery,
};