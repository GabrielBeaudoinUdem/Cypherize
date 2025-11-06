'use client';

import { useRef } from 'react';
import toast from 'react-hot-toast'

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const AiImportIconWithAnimation = () => {
  const starClasses = "fill-current text-gray-800 dark:text-gray-300 transition-colors duration-300 ease-in-out group-hover:text-[#34B27B]";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path className={starClasses} d="M7 3 L7.5 5 L9.5 5.5 L7.5 6 L7 8 L6.5 6 L4.5 5.5 L6.5 5 Z" />
      <path className={starClasses} d="M17 2 L17.5 4 L19.5 4.5 L17.5 5 L17 7 L16.5 5 L14.5 4.5 L16.5 4 Z" />
      <path className={starClasses} d="M20 8 L20.25 9 L21.25 9.25 L20.25 9.5 L20 10.5 L19.75 9.5 L18.75 9.25 L19.75 9 Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5" />
    </svg>
  );
};

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const INTERNAL_KEYS = new Set(['_id', '_label', '_src', '_dst']);

function pickLabel(x) {
  if (!x) return 'Node';
  if (typeof x._label === 'string' && x._label) return x._label;
  if (typeof x.label === 'string' && x.label) return x.label;
  if (Array.isArray(x.labels) && x.labels.length) return x.labels[0];
  if (typeof x.type === 'string' && x.type) return x.type;
  return 'Node';
}

function sanitizeProps(x) {
  const out = {};
  if (!x || typeof x !== 'object') return out;
  for (const [k, v] of Object.entries(x)) {
    if (INTERNAL_KEYS.has(k)) continue;
    if (v === null || v === undefined) continue;
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') { out[k] = v; continue; }
    if (Array.isArray(v)) {
      const arr = v.filter(e => e !== null && e !== undefined && ['string','number','boolean'].includes(typeof e));
      out[k] = arr;
      continue;
    }
  }
  return out;
}

function pickMatchKey(cleanProps) {
  if (cleanProps == null) return null;
  if (cleanProps.id !== undefined && cleanProps.id !== null && (typeof cleanProps.id === 'string' || typeof cleanProps.id === 'number'))
    return { propName: 'id', propValue: cleanProps.id };
  if (typeof cleanProps.name === 'string' && cleanProps.name)
    return { propName: 'name', propValue: cleanProps.name };
  if (typeof cleanProps.title === 'string' && cleanProps.title)
    return { propName: 'title', propValue: cleanProps.title };
  return null;
}

function cypherEscapeString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function toCypherValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'string') return `'${cypherEscapeString(v)}'`;
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return `[${v.map(toCypherValue).join(', ')}]`;
  return 'NULL';
}

function toCypherMap(obj) {
  const entries = Object.entries(obj || {})
    .filter(([, val]) => val !== null && val !== undefined && (typeof val !== 'object' || Array.isArray(val)))
    .map(([k, val]) => `\`${k}\`: ${toCypherValue(val)}`);
  return `{ ${entries.join(', ')} }`;
}

const BDActionsButtons = ({ onQuerySuccess }) => {
  const buttonStyle = "p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-r border-[#2A3239] last:border-r-0";

  const handleExport = async () => {
    try {
      const nodesRes = await fetch('/api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'MATCH (n) RETURN n' }),
      });
      if (!nodesRes.ok) throw new Error('Erreur nodes');
      const { result: nodes = [] } = await nodesRes.json();

      const edgesRes = await fetch('/api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'MATCH (a)-[r]->(b) RETURN a, r, b' }),
      });
      if (!edgesRes.ok) throw new Error('Erreur edges');
      const { result: edges = [] } = await edgesRes.json();

      const dump = {
        generatedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodes, edges,
      };

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'kuzu_dump.json';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la récupération du graphe Kùzu.');
    }
  };

  const fileInputRef = useRef(null);

  const handleClickImport = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleImportFromFile = async (ev) => {
    try {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;

      toast.loading('Import en cours...')

      const text = await file.text();
      const dump = JSON.parse(text);
      const nodes = Array.isArray(dump?.nodes) ? dump.nodes : [];
      const edges = Array.isArray(dump?.edges) ? dump.edges : [];

      for (const n of nodes) {
        const label = pickLabel(n.n);
        const clean = sanitizeProps(n.n);
        const cypher = `
          CREATE (m:${label} ${toCypherMap(clean)})
          RETURN m
        `;
        console.log("ddd:", cypher)
        const res = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: cypher }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          console.log('CREATE node failed', { label, clean }, t);
        }
      }

      for (const e of edges) {
        const a = e?.a, r = e?.r, b = e?.b;
        if (!a || !b || !r) continue;

        const aLabel = pickLabel(a);
        const bLabel = pickLabel(b);
        const rType  = pickLabel(r);

        const aClean = sanitizeProps(a);
        const bClean = sanitizeProps(b);
        const rClean = sanitizeProps(r);

        const aKey = pickMatchKey(aClean);
        const bKey = pickMatchKey(bClean);
        if (!aKey || !bKey) {
          toest.error('Skip edge: no simple key to MATCH', { aLabel, bLabel, aClean, bClean });
          continue;
        }

        const cypher = `
          MATCH (p:\`${aLabel}\` { \`${aKey.propName}\`: ${toCypherValue(aKey.propValue)} })
          MATCH (m:\`${bLabel}\` { \`${bKey.propName}\`: ${toCypherValue(bKey.propValue)} })
          CREATE (p)-[rel:\`${rType}\` ${toCypherMap(rClean)}]->(m)
          RETURN p, rel, m
        `;
        const res = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: cypher }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          console.warn('CREATE edge failed', { aLabel, bLabel, rType, aKey, bKey, rClean }, t);
        }
      }

      try {
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: "MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m" }),
        });
        const data = await response.json();
        if (response.ok) {
          onQuerySuccess(data.result, "MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m");
        }
      } catch (err) {
        console.log(err)
      }

      toast.success('Importation terminé !')
      if (ev.target) ev.target.value = '';
    } catch (err) {
      toest.error('Import failed:', err);
      alert('Échec import Kùzu. Voir console.');
    }
  };


  return (
    <div className="relative group/container">
      <div className="flex items-center bg-[#1E252B] border border-[#2A3239] rounded-lg overflow-hidden">
        <button onClick={handleExport} className={buttonStyle}>
          <ExportIcon />
        </button>
        <button onClick={handleClickImport} className={buttonStyle}>
          <ImportIcon />
        </button>
        <button onClick={() => {}} className={`${buttonStyle} group`}>
          <AiImportIconWithAnimation />
        </button>
        {/*<button onClick={() => {}} className={buttonStyle}>
          <ClearIcon />
        </button>*/}
      </div>

      {/* input fichier masqué */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFromFile}
      />
    </div>
  );
};

export default BDActionsButtons;
