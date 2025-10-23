const kuzu = require('kuzu');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'kuzu_database');
let cachedDb = null;
let cachedSchema = null; // Cache pour le schéma

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


async function getDbSchema() {
  // TODO: faire de vrai requête au lieu de simuler les shema.
  const schema = {
    nodeTables: [
      {
        name: 'Person',
        properties: [
          { name: 'name', type: 'STRING', isPrimaryKey: true },
          { name: 'born', type: 'INT64', isPrimaryKey: false },
        ]
      },
      {
        name: 'Movie',
        properties: [
          { name: 'title', type: 'STRING', isPrimaryKey: true },
          { name: 'released', type: 'INT64', isPrimaryKey: false },
          { name: 'tagline', type: 'STRING', isPrimaryKey: false },
        ]
      }
    ],
    relTables: [
      {
        name: 'ACTED_IN',
        properties: [
          { name: 'roles', type: 'STRING[]', isPrimaryKey: false },
        ],
        src: 'Person',
        dst: 'Movie'
      },
      {
        name: 'DIRECTED',
        properties: [],
        src: 'Person',
        dst: 'Movie'
      }
    ]
  };
  
  return schema;
}

module.exports = {
  initializeDatabase,
  executeCypherQuery,
  getDbSchema,
};