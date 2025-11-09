// ----- Fichier : /app/components/AiAnswer.js -----
'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ChevronDown } from 'lucide-react';

const AiAnswer = ({ content }) => {
  const [isQueryExpanded, setIsQueryExpanded] = useState(false);
  const [isDataExpanded, setIsDataExpanded] = useState(false);

  if (!content) return null;

  const { text, query, data } = content;

  return (
    <div className="bg-[#252F36] rounded-lg p-3 my-2 border border-[#2A3239] w-full text-white">
      {/* Réponse en langage naturel */}
      <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{text}</p>
      
      {(query || (data && data.length > 0)) && (
        <div className="mt-3 pt-3 border-t border-[#2A3239] space-y-2">
          {/* Section pour la requête Cypher */}
          {query && (
            <div>
              <button
                onClick={() => setIsQueryExpanded(!isQueryExpanded)}
                className="flex items-center justify-between w-full text-left text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <span>See executed Cypher query</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isQueryExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isQueryExpanded && (
                <div className="mt-2">
                  <SyntaxHighlighter
                    language="cypher"
                    style={tomorrow}
                    wrapLongLines
                    PreTag="div"
                    customStyle={{ background: "#11181C", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", padding: "12px", whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden" }}
                    codeTagProps={{ style: { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}
                  >
                    {query}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          )}

          {/* Section pour les données brutes */}
          {data && data.length > 0 && (
            <div>
              <button
                onClick={() => setIsDataExpanded(!isDataExpanded)}
                className="flex items-center justify-between w-full text-left text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <span>See raw database response</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isDataExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isDataExpanded && (
                <div className="mt-2">
                  <SyntaxHighlighter
                    language="json"
                    style={tomorrow}
                    wrapLongLines
                    PreTag="div"
                    customStyle={{ background: "#11181C", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", padding: "12px", whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden" }}
                    codeTagProps={{ style: { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}
                  >
                    {JSON.stringify(data, null, 2)}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiAnswer;