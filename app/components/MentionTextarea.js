'use client';

import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  mode = 'ai',
  users = [],
}) {
  // Styles react-mentions pour reproduire le design Tailwind du <textarea>
  const styles = {
    control: {
      backgroundColor: 'transparent',
      fontSize: 15,
      lineHeight: '24px',
      color: '#e5e7eb', // zinc-100
      padding: '0 0', // py-1.5
      maxHeight: '12rem', // max-h-48
      minHeight: '1.8rem',
      position: 'relative', overflow: 'visible'
    },
    highlighter: { // couche d'overlay interne de react-mentions
      padding: 0
    },
    input: {
      margin: 0,
      color: '#e5e7eb',
      outline: 0,
      background: 'transparent',
      border: 0,
      resize: 'none',
    },
    suggestions: {
        borderRadius:'10px',
        textAlign:'left',
      list: {
        backgroundColor: '#20282E', // zinc-900/95
        border: '1px solid #3f3f46b3',           // border-zinc-800
        padding: 4,
        maxHeight: 224,
        overflowY: 'auto',
        boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
        textAlign: 'left',
        borderRadius:'3px'
      },
      item: {
        padding: '6px 8px',
        borderRadius: 10,
        color: '#e4e4e7', // zinc-200
        textAlign: 'left'
      },
      itemFocused: {
        backgroundColor: '#27272a', // zinc-800
        color: 'white',
      },
    },
  };

  // Données de suggestions minimales :
  //  - 1) l'entrée "libre" (= le texte tapé après @)
  //  - 2) (optionnel) vos users passés en props
  const dataProvider = async (query, callback) => {
    const q = (query || '').trim();
    const out = [];

    if (users && users.length) {
      const lower = q.toLowerCase();
      const matches = users
        .filter(u => !q || u.name.toLowerCase().includes(lower) || (u.handle || '').toLowerCase().includes(lower))
        .slice(0, 8)
        .map(u => ({ id: u.id, display: u.name }));
      out.push(...matches);
    }

    callback(out);
  };

  return (
    <div className="relative w-full">
      <MentionsInput
        value={value}
        onChange={(e, newValue, newPlainText) => onChange?.(newValue)}
        style={styles}
        placeholder={placeholder ?? (mode === 'ai' ? 'Posez une question...' : 'Entrez une requête Cypher...')}
        allowSpaceInQuery={false}
        spellCheck={false}
        disabled={disabled}
        className={`flex-1 bg-transparent placeholder:text-zinc-500 max-h-48`}
        allowSuggestionsAboveCursor={true}
        >
        <Mention
            trigger="@"
            data={dataProvider}
            appendSpaceOnAdd
            displayTransform={(id, display) => `@${display}`}
            markup="@[__display__](__id__)"
            style={{backgroundColor:'rgba(52, 178, 123, 0.3)',color: 'transparent',borderRadius: 3}}
            renderSuggestion={(entry, _search, highlighted) => (
                <div className="flex flex-col-reverse gap-2">
                    <div className="flex gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#34B27B] flex items-center justify-center text-xs">
                            {String(entry.display || '').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col leading-5">
                            <span
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: entry.display }}
                            />
                        </div>
                    </div>
                </div>
            )}
        />
        </MentionsInput>

    </div>
  );
}
