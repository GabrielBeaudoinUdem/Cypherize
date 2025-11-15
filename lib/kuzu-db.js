const kuzu = require('kuzu');
const path = require('path');
const fs = require('fs/promises');

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

async function resetDatabase() {
    console.log("Attempting to reset the database by dropping all tables...");
    
    try {
        const allTables = await executeCypherQuery('CALL SHOW_TABLES() RETURN *');
        
        const relTableNames = allTables.filter(t => t.type === 'REL').map(t => t.name);
        const nodeTableNames = allTables.filter(t => t.type === 'NODE').map(t => t.name);

        const dropRelQueries = relTableNames.map(name => `DROP TABLE ${name};`).join('\n');
        const dropNodeQueries = nodeTableNames.map(name => `DROP TABLE ${name};`).join('\n');

        const fullDropQuery = `${dropRelQueries}\n${dropNodeQueries}`;

        if (fullDropQuery.trim().length > 0) {
            console.log("Dropping existing tables...");
            await executeCypherQuery(fullDropQuery);
            console.log("All tables dropped successfully.");
        } else {
            console.log("No tables to drop.");
        }

        cachedSchema = null;
        
        console.log("Database reset complete.");

    } catch (error) {
        console.error("Error during database reset:", error);
        throw new Error("Could not reset the database by dropping tables.");
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

  if (queries.length === 1) {
    try {
        const singleQuery = queries[0];
        const preparedStatement = await connection.prepare(singleQuery);
        const queryResult = await connection.execute(preparedStatement);
        
        const upperQuery = singleQuery.toUpperCase();
        if (upperQuery.includes('CREATE TABLE') || upperQuery.includes('DROP TABLE') || upperQuery.includes('DETACH DELETE') || upperQuery.includes('CREATE NODE') || upperQuery.includes('CREATE REL')) {
            cachedSchema = null;
        }
        
        return await queryResult.getAll();
    } catch (error) {
        console.error("Erreur exécution de la requête unique:", error.message, "Pour la requête:", query);
        throw new Error(`Failed to execute query: ${error.message}`);
    }
  }

  try {
    await connection.query('BEGIN TRANSACTION');
    
    let lastResult = [];
    let shouldInvalidateSchema = false;

    for (const singleQuery of queries) {
      const upperQuery = singleQuery.toUpperCase();
      if (upperQuery.includes('CREATE TABLE') || upperQuery.includes('DROP TABLE') || upperQuery.includes('DETACH DELETE') || upperQuery.includes('CREATE NODE') || upperQuery.includes('CREATE REL')) {
        shouldInvalidateSchema = true;
      }
      
      const preparedStatement = await connection.prepare(singleQuery);
      const queryResult = await connection.execute(preparedStatement);
      lastResult = await queryResult.getAll();
    }
    
    await connection.query('COMMIT');
    
    if (shouldInvalidateSchema) {
        cachedSchema = null;
    }

    return lastResult;

  } catch (error) {
    console.error("Transaction échouée, annulation (rollback). Erreur:", error.message, "Pour le lot de requêtes:", query);
    
    try {
      await connection.query('ROLLBACK');
    } catch (rollbackError) {
      console.error("FATAL: Échec de l'annulation de la transaction:", rollbackError);
    }
    
    throw new Error(`Transaction failed: ${error.message}`);
  }
}

async function getDbSchema() {
  if (cachedSchema) {
    return cachedSchema;
  }
  try {
    const { connection } = await initializeDatabase();
    const schema = { nodeTables: [], relTables: [] };
    const allTablesResult = await executeCypherQuery('CALL SHOW_TABLES() RETURN *');
    const nodeTableNames = allTablesResult.filter(t => t.type === 'NODE').map(t => t.name);
    const relTableNames = allTablesResult.filter(t => t.type === 'REL').map(t => t.name);
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
  resetDatabase,
};