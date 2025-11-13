/**
 * Valide le code Cypher DDL (schéma) généré.
 * @param {string} cypher - Le code Cypher à valider.
 * @returns {boolean} - True si valide, sinon False.
 */
export function validateSchemaCypher(cypher) {
  if (!cypher) return false;

  // Interdire toute syntaxe SQL ou non-Kuzu
  const forbiddenPatterns = [
    /\b(varchar|text|char|decimal|numeric|float|references|foreign\s+key)/i,
    /\bconstraint\b/i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(cypher)) {
      console.warn("Validation Schema Failed: Found forbidden SQL syntax ->", cypher.match(pattern)[0]);
      return false;
    }
  }

  // Vérifie que seules des CREATE NODE TABLE ou CREATE REL TABLE existent
  const createStatements = cypher.match(/CREATE\s+.*TABLE/gi) || [];
  for (const stmt of createStatements) {
    if (!/CREATE\s+(NODE|REL)\s+TABLE/i.test(stmt)) {
      console.warn("Validation Schema Failed: Invalid CREATE statement (must be NODE or REL TABLE).", stmt);
      return false;
    }
  }

  // Vérifie la structure minimale de chaque CREATE NODE TABLE
  const nodeStatements = cypher.match(/CREATE\s+NODE\s+TABLE\s*`?\w+`?\s*\(([\s\S]+?)\)/gi) || [];
  for (const stmt of nodeStatements) {
    if (!/\bid\s+SERIAL\b/i.test(stmt) || !/\bPRIMARY\s+KEY\s*\(\s*id\s*\)/i.test(stmt)) {
      console.warn("Validation Schema Failed: NODE TABLE missing 'id SERIAL' or 'PRIMARY KEY (id)'.", stmt);
      return false;
    }
  }

  // Vérifie la structure des REL TABLE : doit contenir FROM ... TO ...
  const relStatements = cypher.match(/CREATE\s+REL\s+TABLE[\s\S]+?\)/gi) || [];
  for (const stmt of relStatements) {
    if (!/\bFROM\b/i.test(stmt) || !/\bTO\b/i.test(stmt)) {
      console.warn("Validation Schema Failed: REL TABLE missing 'FROM ... TO ...'.", stmt);
      return false;
    }
  }

  return true;
}

/**
 * Valide le code Cypher DML (données) généré.
 * @param {string} cypher - Le code Cypher à valider.
 * @returns {boolean} - True si valide, sinon False.
 */
export function validateDataCypher(cypher) {
  if (!cypher) return false;

  const queries = cypher
    .split(/;\s*\n?/)
    .map(q => q.trim())
    .filter(q => q.length > 0);

  for (const query of queries) {
    // Vérifie que MERGE de lien suit bien un MATCH ... MATCH ...
    if (/MERGE\s*\(.*\)-\[.*\]->\(.*\)/i.test(query)) {
      const matchCount = (query.match(/\bMATCH\b/gi) || []).length;
      if (matchCount < 2) {
        // C'est une erreur sauf si c'est un MERGE inline complet, ex: MERGE (a:Person {name:'A'})-[:KNOWS]->(b:Person {name:'B'})
        // Ce cas est plus complexe à rejeter, mais le pattern sans MATCH est la cause la plus fréquente d'erreur.
        console.warn("Validation Data Failed: Relationship MERGE might be missing two preceding MATCH clauses.", query);
        // On peut rendre cette règle plus stricte si nécessaire, mais pour l'instant on la laisse passer
        // return false;
      }
    }

     // Vérifie que les MATCH précèdent bien les MERGE dans l'ordre pour les relations
    if (/MATCH/i.test(query) && /MERGE\s*\(.*\)-\[.*\]->\(.*\)/i.test(query)) {
      const matchIndex = query.search(/\bMATCH\b/i);
      const mergeIndex = query.search(/\bMERGE\b/i);
      if (mergeIndex < matchIndex) {
        console.warn("Validation Data Failed: MERGE appears before MATCH.", query);
        return false;
      }
    }
  }

  return true;
}