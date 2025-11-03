'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Clock } from "lucide-react";

const InspectorPanel = ({ element, onClose, onSaveChanges, onDeleteElement }) => {
  const [editableProperties, setEditableProperties] = useState({});
  const [primaryKey, setPrimaryKey] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/schema');
        if (!response.ok) throw new Error('Failed to fetch schema');
        const data = await response.json();
        setSchema(data);
      } catch (error) {
        console.error("Erreur de chargement du schéma:", error);
      }
    };
    fetchSchema();
  }, []);

  useEffect(() => {
    if (!element || !element.data || !element.data.properties || !schema) {
      setEditableProperties({});
      setPrimaryKey(null);
      setHasChanges(false);
      return;
    }

    const { label_type } = element.data;
    const isNode = element.isNode;

    const tableSchema = isNode
      ? schema.nodeTables.find(t => t.name === label_type)
      : schema.relTables.find(t => t.name === label_type);

    if (!tableSchema) {
      console.warn(`Schéma non défini pour le label "${label_type}".`);
      setEditableProperties(element.data.properties);
      setPrimaryKey(null);
    } else {
      const newEditableProperties = {};
      tableSchema.properties.forEach(prop => {
        newEditableProperties[prop.name] = element.data.properties[prop.name] ?? '';
      });
      setEditableProperties(newEditableProperties);

      const pk = tableSchema.properties.find(p => p.isPrimaryKey);
      setPrimaryKey(pk ? pk.name : null);
    }

    setHasChanges(false);

  }, [element, schema]);

  useEffect(() => {
    if (!element || !element.data || !element.data.properties || Object.keys(editableProperties).length === 0) return;

    const originalProperties = element.data.properties;

    const areDifferent = Object.keys(editableProperties).some(key =>
      String(originalProperties[key] ?? '') !== String(editableProperties[key] ?? '')
    );
    setHasChanges(areDifferent);

  }, [editableProperties, element]);

  if (!element) return null;

  const { data, isNode } = element;

  if (!element || !data) return null;


  const handlePropertyChange = (key, value) => {
    setEditableProperties(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!hasChanges || !primaryKey) return;
    const { label_type } = data;
    const originalPrimaryKeyValue = data.properties[primaryKey];

    const setClauses = Object.entries(editableProperties)
      .filter(([key, value]) => {
        return key !== primaryKey && String(value) !== String(data.properties[key] ?? '');
      })
      .map(([key, value]) => {
        const isNumeric = !isNaN(parseFloat(value)) && isFinite(value) && value.trim() !== '';
        const formattedValue = isNumeric ? value : `'${String(value).replace(/'/g, "\\'")}'`;
        return `item.${key} = ${formattedValue}`;
      })
      .join(', ');

    if (!setClauses) return;

    const primaryKeyValueFormatted = typeof originalPrimaryKeyValue === 'string'
      ? `'${String(originalPrimaryKeyValue).replace(/'/g, "\\'")}'`
      : originalPrimaryKeyValue;

    const updateQuery = `MATCH (item:${label_type} {${primaryKey}: ${primaryKeyValueFormatted}}) SET ${setClauses}`;
    onSaveChanges(updateQuery);
  };

  const handleDelete = () => {
    if (!onDeleteElement || !primaryKey) {
      console.error("onDeleteElement non fournie ou clé primaire inconnue !");
      return;
    }
    const { label_type } = data;
    const primaryKeyValue = data.properties[primaryKey];
    const primaryKeyValueFormatted = typeof primaryKeyValue === 'string'
      ? `'${String(primaryKeyValue).replace(/'/g, "\\'")}'`
      : primaryKeyValue;

    let deleteQuery;
    if (isNode) {
      deleteQuery = `MATCH (item:${label_type} {${primaryKey}: ${primaryKeyValueFormatted}}) DETACH DELETE item`;
    } else {
      deleteQuery = `MATCH ()-[item:${label_type} {${primaryKey}: ${primaryKeyValueFormatted}}]->() DELETE item`;
    }
    onDeleteElement(deleteQuery);
  };

    return (
    <div className="flex flex-col h-full [background-color:#1A2127] [border-left:#2A2A2A_1px_solid] p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{isNode ? 'Détails du Nœud' : 'Détails de la Relation'}</h3>
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-500">ID Kuzu</label>
          <p className="text-xs p-2 bg-[#252F36] rounded-sm">
            {`${data.kuzu_id.table}-${data.kuzu_id.offset}`}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Label</label>
          <p className="p-2 bg-[#252F36] rounded-sm text-xs">{data.label_type}</p>
        </div>
        <h4 className="font-semibold pt-2 border-t dark:border-gray-600">Propriétés</h4>
        {Object.keys(editableProperties).length > 0 ? (
          Object.entries(editableProperties).map(([key, value]) => {
            const isModified = String(data.properties[key] ?? '') !== String(value ?? '');
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-500 capitalize">{key}</label>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={value ?? ""}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    readOnly={key === primaryKey}
                    className={`w-full pr-8 mt-1 text-xs rounded-sm bg-[#252F36] border border-transparent focus:outline-none focus:ring-0
                      transition-all duration-200 text-white p-2
                      ${key === primaryKey ? 'cursor-not-allowed opacity-70' : ''}
                      ${isModified ? 'pl-3' : 'pl-3'}`}
                  />

                  <div className="absolute right-3 top-5.5 -translate-y-1/2 text-zinc-400">
                      {key != primaryKey && (
                        <>
                          {isModified ? (
                            <Clock className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <Edit3 className="w-4 h-4 text-zinc-500" />
                          )}
                        </>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-400 italic">Aucune propriété définie</p>
        )}
      </div>

      <div className="pt-6 border-t dark:border-gray-600 space-y-3">
         <button
          onClick={handleSave}
          disabled={!hasChanges || !primaryKey}
          className={`btn w-full transition-all duration-300 font-semibold text-white rounded-sm text-base py-3
            ${(hasChanges && primaryKey)
              ? 'bg-[#34B27B] hover:bg-green-500'
              : 'bg-gray-400 dark:bg-gray-700 text-gray-800 dark:text-gray-400 cursor-not-allowed'
            }`
          }
        >
          Sauvegarder
        </button>
        <button
          onClick={handleDelete}
          disabled={!primaryKey}
          className={`btn w-full bg-[#E45858] hover:bg-red-500 text-white font-semibold rounded-sm text-base py-3 transition-colors ${!primaryKey ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};

export default InspectorPanel;