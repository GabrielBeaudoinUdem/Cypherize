'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ChevronDown } from 'lucide-react';
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const AiAnswer = ({ content }) => {
  const [expanded, setExpanded] = useState(null);

  if (!content) return null;

  const { text, query, data } = content;

  return (
    <div className="rounded-lg p-3 my-2 border border-[#2A3239] w-85 text-white">
      {/* Réponse en langage naturel */}
      <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {text}
        </ReactMarkdown>
      </p>

      <div className="space-y-2 mt-2">
        {/* Ligne des deux boutons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {query && (
            <button
              onClick={() => setExpanded(expanded === 'query' ? null : 'query')}
              className="inline-flex items-center justify-between gap-2 text-left text-xs text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-md"
              aria-expanded={expanded === 'query'}
              aria-controls="panel-query"
            >
              <span>See executed Cypher query</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${expanded === 'query' ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {data && data.length > 0 && (
            <button
              onClick={() => setExpanded(expanded === 'data' ? null : 'data')}
              className="inline-flex items-center justify-between gap-2 text-left text-xs text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-md"
              aria-expanded={expanded === 'data'}
              aria-controls="panel-data"
            >
              <span>See raw database response</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${expanded === 'data' ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Panneau : Query */}
        {query && expanded === 'query' && (
          <div id="panel-query" className="mt-2">
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

        {/* Panneau : Data */}
        {data && data.length > 0 && expanded === 'data' && (
          <div id="panel-data" className="mt-2">
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
    </div>
  );
};

export default AiAnswer;