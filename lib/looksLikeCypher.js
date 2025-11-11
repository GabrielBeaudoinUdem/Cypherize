// Heuristique "looks like Cypher" (durcie + gardes fous Markdown)
export function looksLikeCypher(input) {
  if (!input || typeof input !== 'string') return false;
  const s = input.trim();

  // --- 0) Garde-fous contre les syntaxes Markdown/Obsidian/mentions ---
  //  [text](url), (text)[ref], @[display](id), #tag(...) ou variantes proches
  const markdownLike =
    /\[[^\]]+\]\([^)]+\)/.test(s) ||      // [label](link)
    /\([^)]+\)\[[^\]]+\]/.test(s) ||      // (label)[ref]
    /@\[[^\]]+\]\([^)]+\)/.test(s) ||     // @[display](id)
    /^#\([^)]+\)\[[^\]]+\]$/.test(s) ||   // #(something)[something]
    /^@\[[^\]]+\]$/.test(s);              // @[something]
  if (markdownLike) return false;

  // --- 1) Motifs structurels vraiment Cypher ---
  const nodeWithLabel = /\([A-Za-z_][A-Za-z0-9_]*\s*:\s*[A-Za-z_][A-Za-z0-9_]*\)/;   // (n:Label)
  const relArrowFwd   = /\([^\)]*\)-\[[^\]]*\]->\([^\)]*\)/;                         // (a)-[r]->(b)
  const relArrowBack  = /\([^\)]*\)<-\[[^\]]*\]-\([^\)]*\)/;                         // (a)<-[r]-(b)
  const anyArrow      = /<-\[|\]-|->/;                                               // fragment de flèche
  const paramVar      = /\$[A-Za-z_][A-Za-z0-9_]*/;                                  // $param
  const mapLiteral    = /\{[^}]*:[^}]*\}/;                                           // {k: v}

  // --- 2) Mots-clés cœur (on enlève ID) ---
  const keywords = [
    'MATCH','RETURN','WHERE','WITH','UNWIND','MERGE','CREATE','DELETE','DETACH',
    'SET','REMOVE','CALL','YIELD','LOAD\\s+CSV','OPTIONAL\\s+MATCH','LIMIT','SKIP',
    'ORDER\\s+BY','FOREACH','TOINTEGER','TOFLOAT','TOLIST','SPLIT','EXISTS','LABELS',
    'NODES','RELATIONSHIPS'
  ];
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');
  const kwMatches = s.match(new RegExp(kwRegex, 'gi')) || [];

  // --- 3) Indices anti-SQL ---
  const sqlWords = /\b(SELECT|FROM|JOIN|GROUP\s+BY|INSERT|UPDATE|TABLE)\b/i;

  // --- 4) Scoring + critères durs ---
  let score = 0;

  // Structure Cypher
  if (nodeWithLabel.test(s)) score += 2;
  if (relArrowFwd.test(s) || relArrowBack.test(s)) score += 2;
  if (anyArrow.test(s)) score += 1;
  if (paramVar.test(s)) score += 1;
  if (mapLiteral.test(s)) score += 1;

  // Keywords
  score += kwMatches.length; // +1 par mot-clé

  // Pénalités
  if (sqlWords.test(s)) score -= 3;
  if (s.length < 8) score -= 1;

  // --- 5) Critère final plus strict ---
  // On exige AU MOINS l’un des ancrages "forts" suivants :
  const hasStrongCypherAnchor =
    nodeWithLabel.test(s) ||                 // (n:Label)
    relArrowFwd.test(s) || relArrowBack.test(s) || // relation explicite
    kwMatches.length > 0;                    // ou un vrai mot-clé Cypher

  // Seuil ajusté
  return hasStrongCypherAnchor && score >= 3;
}
