// Heuristique "looks like Cypher"
export function looksLikeCypher(input) {
  if (!input) return false;
  const s = input.trim();

  // 1) Motifs structurels très typiques de Cypher
  const structuralPatterns = [
    /\([A-Za-z_][A-Za-z0-9_]*\s*:\s*[A-Za-z_][A-Za-z0-9_]*\)/,  // (n:Label)
    /\([^\)]*\)-\[[^\]]*\]->\([^\)]*\)/,                        // (a)-[r]->(b)
    /\([^\)]*\)<-\[[^\]]*\]-\([^\)]*\)/,                        // (a)<-[r]-(b)
    /-[>\]]\(/,                                                 // flèche -> suivie d'un noeud
    /:\s*[A-Za-z_][A-Za-z0-9_]*/,                               // :Label ou :RELTYPE
    /\$[A-Za-z_][A-Za-z0-9_]*/,                                 // $param
    /\{[^}]*:[^}]*\}/,                                          // map {k: v}
  ];

  // 2) Mots-clés cœur de Cypher (insensible à la casse)
  const keywords = [
    'MATCH','RETURN','WHERE','WITH','UNWIND','MERGE','CREATE','DELETE','DETACH',
    'SET','REMOVE','CALL','YIELD','LOAD\\s+CSV','OPTIONAL\\s+MATCH','LIMIT','SKIP',
    'ORDER\\s+BY','FOREACH','TOINTEGER','TOFLOAT','TOLIST','SPLIT','EXISTS','LABELS',
    'NODES','RELATIONSHIPS','ID'
  ];
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');

  // 3) Indices anti-SQL (pour éviter faux positifs SQL)
  const sqlWords = /\b(SELECT|FROM|JOIN|GROUP\s+BY|INSERT|UPDATE|TABLE)\b/i;

  // 4) Scoring simple
  let score = 0;

  // Motifs structurels
  for (const r of structuralPatterns) {
    if (r.test(s)) score += 2;
  }

  // Mots-clés
  const kwMatches = s.match(new RegExp(kwRegex, 'gi')) || [];
  score += kwMatches.length; // +1 par mot-clé trouvé

  // Pénalité si du SQL clair est présent (Cypher n’utilise pas SELECT/FROM…)
  if (sqlWords.test(s)) score -= 3;

  // Pénalités pour chaînes très courtes ou sans espaces
  if (s.length < 8) score -= 1;

  // Seuil empirique (à régler selon tes données)
  return score >= 3;
}
