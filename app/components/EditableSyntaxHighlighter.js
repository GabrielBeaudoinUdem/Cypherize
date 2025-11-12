'use client';

import React, { useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";

const EditableSyntaxHighlighter = ({ value, onChange, language = 'cypher', disabled = false }) => {
  const textareaRef = useRef(null);
  const preRef = useRef(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const sharedStyles = {
    margin: 0,
    padding: '12px', 
    fontFamily: 'monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'auto',
  };

  return (
    <div className="relative w-full h-48 rounded-md bg-[#252F36] border border-[#2A3239] focus-within:ring-2 focus-within:ring-[#34B27B]/50 overflow-hidden">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck="false"
        disabled={disabled}
        style={{
          ...sharedStyles,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          color: 'transparent',
          caretColor: 'white',
          backgroundColor: 'transparent',
          border: 'none',
          resize: 'none',
          outline: 'none',
        }}
      />
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        wrapLongLines
        PreTag={(props) => <pre ref={preRef} {...props} />}
        customStyle={{
          ...sharedStyles,
          position: 'relative',
          zIndex: 0,
          pointerEvents: 'none',
          height: '100%',
        }}
        codeTagProps={{
            style: {
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
            }
        }}
      >
        {String(value) + '\n'}
      </SyntaxHighlighter>
    </div>
  );
};

export default EditableSyntaxHighlighter;