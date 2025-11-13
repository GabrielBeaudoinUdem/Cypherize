const kuzu = require('kuzu');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'kuzu_database');
let cachedDb = null;
let cachedSchema = null;

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
  
  const queries = query.split(';')
    .map(q => q.trim())
    .filter(q => q.length > 0);

  if (queries.length === 0) {
    return [];
  }

  let lastResult = [];
  let shouldInvalidateSchema = false;

  try {
    for (const singleQuery of queries) {
      const upperQuery = singleQuery.toUpperCase();
      if (upperQuery.includes('CREATE TABLE') || upperQuery.includes('DROP TABLE') || upperQuery.includes('DETACH DELETE')) {
        shouldInvalidateSchema = true;
      }
      
      const preparedStatement = await connection.prepare(singleQuery);
      const queryResult = await connection.execute(preparedStatement);
      lastResult = await queryResult.getAll();
    }
    
    if (shouldInvalidateSchema) {
        cachedSchema = null;
    }

    return lastResult;
  } catch (error) {
    console.error("Erreur exécution de la requête:", error.message, "Pour la requête:", error.query || query);
    throw new Error(`Failed to execute query: ${error.message}`);
  }
}

async function getDbSchema() {
  if (cachedSchema) {
    return cachedSchema;
  }
  try {
    const schema = { nodeTables: [], relTables: [] };
    // Obtenir toutes les tables
    const allTablesResult = await executeCypherQuery('CALL SHOW_TABLES() RETURN *');
    const nodeTableNames = allTablesResult.filter(t => t.type === 'NODE').map(t => t.name);
    const relTableNames = allTablesResult.filter(t => t.type === 'REL').map(t => t.name);
        // Traiter les noeuds
    const nodeTablePromises = nodeTableNames.map(async (tableName) => {
      const tableInfo = await executeCypherQuery(`CALL TABLE_INFO('${tableName}') RETURN *`);
      const properties = tableInfo.filter(prop => !prop.name.startsWith('_')).map(prop => ({ name: prop.name, type: prop.type, isPrimaryKey: prop['primary key'] === true }));
      return { name: tableName, properties };
    });
    schema.nodeTables = await Promise.all(nodeTablePromises);
    const relTablePromises = relTableNames.map(async (tableName) => {
      const tableInfo = await executeCypherQuery(`CALL TABLE_INFO('${tableName}') RETURN *`);
      if (tableInfo.length === 0) return null;
      const properties = tableInfo.filter(prop => !prop.name.startsWith('_')).map(prop => ({ name: prop.name, type: prop.type, isPrimaryKey: prop['primary key'] === true }));
      const src = tableInfo[0]?.from;
      const dst = tableInfo[0]?.to;
      return { name: tableName, properties, src, dst };
    });
    schema.relTables = (await Promise.all(relTablePromises)).filter(Boolean);
    cachedSchema = schema;
    return schema;
  } catch (error) {
    console.error("Erreur lors de la récupération dynamique du schéma:", error);
    return { nodeTables: [], relTables: [] };
  }
}

module.exports = {
  initializeDatabase,
  executeCypherQuery,
  getDbSchema,
};