'use client';

import { useState, useEffect } from 'react';
import EditableSyntaxHighlighter from './EditableSyntaxHighlighter';

const QueryConfirmation = ({ query, onConfirm, onCancel }) => {
  const [editableQuery, setEditableQuery] = useState(query);

  useEffect(() => {
    setEditableQuery(query);
  }, [query]);

  return (
    <div className="rounded-lg p-3 my-2 border border-[#2A3239] w-85 text-white">
      <h4 className="font-semibold text-sm text-gray-200 mb-2">Confirmation required</h4>
      <EditableSyntaxHighlighter
        value={editableQuery}
        onChange={setEditableQuery}
        language="cypher"
        className="!bg-[#11181C] max-h-60 h-auto"
        customSharedStyles={{
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      />

      <div className="flex justify-end gap-1.5 mt-2">
        <button
          onClick={onCancel}
          className="h-7 px-2.5 text-[13px] rounded-[5px] border border-[#2A3239] bg-transparent
                    text-zinc-400 hover:text-white hover:border-[#3A434A]
                    transition-colors duration-150 ease-out"
        >
          Cancel
        </button>

        <button
          onClick={() => onConfirm(editableQuery)}
          className="h-7 px-2.5 text-[13px] rounded-[5px] bg-[#34B27B] text-[#0B1215]
                    hover:bg-[#3BCF92] font-medium transition-colors duration-150 ease-out"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default QueryConfirmation;