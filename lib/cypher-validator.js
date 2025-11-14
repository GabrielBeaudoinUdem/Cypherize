/**
 * Valide le code Cypher DDL (schéma) généré.
 * @param {string} cypher - Le code Cypher à valider.
 * @returns {boolean} - True si valide, sinon False.
 */
export function validateSchemaCypher(cypher) {
  if (!cypher || cypher.trim() === '') return true; // Une réponse vide est valide

  // Interdire toute syntaxe SQL (non-Kuzu)
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

  const statements = cypher.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
      if (!/CREATE\s+(NODE|REL)\s+TABLE/i.test(stmt)) {
          console.warn("Validation Schema Failed: Contains non-CREATE TABLE statements.", stmt);
          return false;
      }
      // Règle stricte pour les tables NODE
      if (/CREATE\s+NODE\s+TABLE/i.test(stmt)) {
          if (!/\bid\s+SERIAL\b/i.test(stmt) || !/\bPRIMARY\s+KEY\s*\(\s*id\s*\)/i.test(stmt)) {
            console.warn("Validation Schema Failed: NODE TABLE missing 'id SERIAL' or 'PRIMARY KEY (id)'.", stmt);
            return false;
          }
      }
      // Règle stricte pour les tables REL
      if (/CREATE\s+REL\s+TABLE/i.test(stmt)) {
          if (!/\bFROM\b/i.test(stmt) || !/\bTO\b/i.test(stmt)) {
            console.warn("Validation Schema Failed: REL TABLE missing 'FROM ... TO ...'.", stmt);
            return false;
          }
          if (/\b(id\s+SERIAL|PRIMARY\s+KEY)/i.test(stmt)) {
            console.warn("Validation Schema Failed: REL TABLE must not contain 'id SERIAL' or 'PRIMARY KEY'.", stmt);
            return false;
          }
      }
  }

  return true;
}


/**
 * Valide le code Cypher pour la création de nœuds.
 * @param {string} cypher - Le code Cypher à valider.
 * @returns {boolean} - True si valide, sinon False.
 */
export function validateNodeCypher(cypher) {
  if (!cypher || cypher.trim() === '') return true; // Vide est valide

  const queries = cypher.split(/;\s*\n?/).map(q => q.trim()).filter(q => q.length > 0);
  for (const query of queries) {
    // Doit être un MERGE ou CREATE
    if (!/^(MERGE|CREATE)/i.test(query)) {
      console.warn("Validation Node Failed: Must start with MERGE or CREATE.", query);
      return false;
    }
    // Ne doit pas contenir de pattern de relation
    if (/-\s*\[.*\]\s*->/i.test(query) || /<-\s*\[.*\]\s*-/i.test(query)) {
      console.warn("Validation Node Failed: Contains relationship pattern.", query);
      return false;
    }
  }
  return true;
}