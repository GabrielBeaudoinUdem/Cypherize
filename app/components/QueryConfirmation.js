'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";

const QueryConfirmation = ({ query, onConfirm, onCancel }) => {
  const [editableQuery, setEditableQuery] = useState(query);

  useEffect(() => {
    setEditableQuery(query);
  }, [query]);

  return (
    <div className="bg-[#252F36] rounded-sm p-2 my-2 border-l-4 border-[#34B27B]">
      <h4 className="font-semibold text-sm text-gray-200 mb-2">Confirmation requise</h4>
      <SyntaxHighlighter
        language="cypher"
        style={tomorrow}
        wrapLongLines
        PreTag="div"
        customStyle={{
          background: "#11181C",
          borderRadius: "6px",
          fontSize: "12px",
          fontFamily: "monospace",
          padding: "12px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
        }}
        codeTagProps={{
          style: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
        }}
      >
        {editableQuery}
      </SyntaxHighlighter>

      <div className="flex justify-end gap-1.5 mt-2">
        <button
          onClick={onCancel}
          className="h-7 px-2.5 text-[13px] rounded-[5px] border border-[#2A3239] bg-transparent
                    text-zinc-400 hover:text-white hover:border-[#3A434A]
                    transition-colors duration-150 ease-out"
        >
          Annuler
        </button>

        <button
          onClick={() => onConfirm(editableQuery)}
          className="h-7 px-2.5 text-[13px] rounded-[5px] bg-[#34B27B] text-[#0B1215]
                    hover:bg-[#3BCF92] font-medium transition-colors duration-150 ease-out"
        >
          Confirmer
        </button>
      </div>
    </div>
  );
};

export default QueryConfirmation;