'use client';

import { useState, useEffect } from 'react';

const QueryConfirmation = ({ query, onConfirm, onCancel }) => {
  const [editableQuery, setEditableQuery] = useState(query);

  useEffect(() => {
    setEditableQuery(query);
  }, [query]);

  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 my-2 border-l-4 border-purple-500 shadow-md">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Confirmation requise</h4>
      <textarea
        value={editableQuery}
        onChange={(e) => setEditableQuery(e.target.value)}
        rows="4"
        className="w-full bg-gray-800 dark:bg-gray-900 text-white p-3 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        spellCheck="false"
      />
      <div className="flex justify-end space-x-2 mt-4">
        <button 
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors"
        >
          Annuler
        </button>
        <button 
          onClick={() => onConfirm(editableQuery)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
        >
          Confirmer
        </button>
      </div>
    </div>
  );
};

export default QueryConfirmation;