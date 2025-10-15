'use client';

import React, { useState, useEffect } from 'react';

const InspectorPanel = ({ element, onClose, onSaveChanges, onDeleteElement }) => {
  const [editableProperties, setEditableProperties] = useState({});
  const [primaryKey, setPrimaryKey] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (element && element.data && element.data.properties) {
      setEditableProperties(element.data.properties);
      setPrimaryKey(Object.keys(element.data.properties)[0]);
      setHasChanges(false);
    }
  }, [element]);

  useEffect(() => {
    if (!element || !element.data || !element.data.properties) return;
    const originalProperties = element.data.properties;
    const areDifferent = Object.keys(originalProperties).some(
      key => String(originalProperties[key]) !== String(editableProperties[key])
    );
    setHasChanges(areDifferent);
  }, [editableProperties, element]);

  if (!element) return null;

  const { data, isNode } = element;

  const handlePropertyChange = (key, value) => {
    setEditableProperties(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!hasChanges) return;
    const { label_type } = data;
    const originalPrimaryKeyValue = data.properties[primaryKey];
    const setClauses = Object.entries(editableProperties)
      .filter(([key]) => key !== primaryKey && String(editableProperties[key]) !== String(data.properties[key]))
      .map(([key, value]) => {
        const formattedValue = typeof value === 'string' && isNaN(value) ? `'${value.replace(/'/g, "\\'")}'` : value;
        return `item.${key} = ${formattedValue}`;
      })
      .join(', ');
    if (!setClauses) return;
    const updateQuery = `MATCH (item:${label_type} {${primaryKey}: '${String(originalPrimaryKeyValue).replace(/'/g, "\\'")}'}) SET ${setClauses}`;
    onSaveChanges(updateQuery);
  };

  const handleDelete = () => {
    if (!onDeleteElement) {
      console.error("onDeleteElement non fournie !");
      return;
    }
    const { label_type } = data;
    const primaryKeyValue = String(data.properties[primaryKey]).replace(/'/g, "\\'");
    let deleteQuery;
    if (isNode) {
      deleteQuery = `MATCH (item:${label_type} {${primaryKey}: '${primaryKeyValue}'}) DETACH DELETE item`;
    } else {
      deleteQuery = `MATCH ()-[item:${label_type} {${primaryKey}: '${primaryKeyValue}'}]->() DELETE item`;
    }
    onDeleteElement(deleteQuery);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{isNode ? 'Détails du Nœud' : 'Détails de la Relation'}</h3>
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <div>
            <label className="block text-sm font-medium text-gray-500">ID Kuzu</label>
            <p className="text-xs p-2 bg-gray-200 dark:bg-gray-700 rounded">
              {`${data.kuzu_id.table}-${data.kuzu_id.offset}`}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Label</label>
            <p className="p-2 bg-gray-200 dark:bg-gray-700 rounded">{data.label_type}</p>
          </div>
          <h4 className="font-semibold pt-2 border-t dark:border-gray-600">Propriétés</h4>
          {Object.keys(data.properties).length > 0 ? (
            Object.entries(editableProperties).map(([key, value]) => {
              const isModified = String(data.properties[key]) !== String(value);
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-500 capitalize">{key}</label>
                  <input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    readOnly={key === primaryKey}
                    className={`input input-bordered w-full mt-1 transition-all duration-200 
                      ${key === primaryKey ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed' : ''}
                      ${isModified ? 'border-l-4 border-l-blue-500 pl-3' : 'border-gray-300 dark:border-gray-600'}`
                    }
                  />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune propriété modifiable.</p>
          )}
      </div>

      <div className="pt-6 border-t dark:border-gray-600 space-y-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`btn w-full transition-all duration-300 font-semibold text-white rounded-lg text-base py-3
            ${hasChanges
              ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              : 'bg-gray-400 dark:bg-gray-700 text-gray-800 dark:text-gray-400 cursor-not-allowed'
            }`
          }
        >
          Sauvegarder
        </button>
        <button
          onClick={handleDelete}
          className="btn w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-semibold rounded-lg text-base py-3"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};

export default InspectorPanel;