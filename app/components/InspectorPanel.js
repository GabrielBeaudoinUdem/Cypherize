'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Clock, KeyRound } from "lucide-react";

const validateProperty = (value, kuzuType) => {
  if (value === null || value === '' || value === undefined) {
    return null;
  }

  const strValue = String(value);

  switch (kuzuType) {
    case 'INT64':
    case 'INT32':
    case 'INT16':
    case 'INT8':
      if (!/^-?\d+$/.test(strValue)) {
        return 'Doit être un nombre entier.';
      }
      break;
    case 'DOUBLE':
    case 'FLOAT':
      if (isNaN(parseFloat(strValue)) || !isFinite(Number(strValue))) {
        return 'Doit être un nombre valide.';
      }
      break;
    case 'BOOLEAN':
      if (strValue.toLowerCase() !== 'true' && strValue.toLowerCase() !== 'false') {
        return 'Doit être "true" ou "false".';
      }
      break;
    case 'DATE':
      if (isNaN(Date.parse(strValue))) {
        return 'Doit être une date valide (ex: YYYY-MM-DD).';
      }
      break;
    case 'STRING':
    default:
      return null;
  }
  return null;
};


const InspectorPanel = ({ element, onClose, onSaveChanges, onDeleteElement }) => {
  const [editableProperties, setEditableProperties] = useState({});
  const [primaryKey, setPrimaryKey] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [schema, setSchema] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

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
      setValidationErrors({});
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
    setValidationErrors({});

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

    if (schema) {
      const { label_type } = element.data;
      const tableSchema = element.isNode
        ? schema.nodeTables.find(t => t.name === label_type)
        : schema.relTables.find(t => t.name === label_type);
      
      const propSchema = tableSchema?.properties.find(p => p.name === key);
      if (propSchema) {
        const errorMessage = validateProperty(value, propSchema.type);
        setValidationErrors(prev => ({ ...prev, [key]: errorMessage }));
      }
    }
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
        const tableSchema = isNode
            ? schema.nodeTables.find(t => t.name === label_type)
            : schema.relTables.find(t => t.name === label_type);
        const propSchema = tableSchema?.properties.find(p => p.name === key);
        const kuzuType = propSchema?.type || 'STRING';

        let formattedValue;
        if (['INT64', 'INT32', 'INT16', 'INT8', 'DOUBLE', 'FLOAT', 'BOOLEAN'].includes(kuzuType)) {
            formattedValue = (value === '' || value === null) ? 'NULL' : value;
        } else {
            formattedValue = (value === null) ? 'NULL' : `'${String(value).replace(/'/g, "\\'")}'`;
        }

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
  
  const hasValidationErrors = Object.values(validationErrors).some(error => error !== null);

  return (
    <div className="flex flex-col h-full [background-color:#1A2127] [border-left:#2A2A2A_1px_solid] p-4 shadow-lg text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{isNode ? 'Détails du Nœud' : 'Détails de la Relation'}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-light">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-400">ID Kuzu</label>
          <p className="text-xs p-2 bg-[#252F36] rounded-sm mt-1 text-gray-300">
            {`${data.kuzu_id.table}-${data.kuzu_id.offset}`}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Label</label>
          <p className="p-2 bg-[#252F36] rounded-sm text-xs mt-1 text-gray-300">{data.label_type}</p>
        </div>
        <h4 className="font-semibold pt-2 border-t border-gray-700 text-gray-200">Propriétés</h4>
        {Object.keys(editableProperties).length > 0 ? (
          Object.entries(editableProperties).map(([key, value]) => {
            const isModified = String(data.properties[key] ?? '') !== String(value ?? '');
            const isPK = key === primaryKey;
            const error = validationErrors[key];
            return (
              <div key={key}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 capitalize">
                  {isPK && <KeyRound className="w-3.5 h-3.5 text-[#34B27B]" />}
                  <span>{key}</span>
                </label>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={value ?? ""}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    readOnly={isPK}
                    className={`w-full pr-8 mt-1 text-xs rounded-sm bg-[#252F36] border focus:outline-none focus:ring-2 
                      transition-all duration-200 text-white p-2
                      ${isPK ? 'cursor-not-allowed opacity-70' : ''}
                      ${error 
                          ? 'border-red-500 focus:ring-red-500/50' 
                          : isPK 
                            ? 'border-[#34B27B]/60 focus:ring-green-500/50'
                            : 'border-transparent focus:ring-green-500/50'
                      }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      {!isPK && (
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
                 {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-400 italic">Aucune propriété définie</p>
        )}
      </div>

      <div className="pt-4 mt-2 border-t border-gray-700 space-y-3">
         <button
          onClick={handleSave}
          disabled={!hasChanges || !primaryKey || hasValidationErrors}
          className={`w-full transition-all duration-300 font-semibold text-white rounded-sm text-sm py-2.5
            ${(hasChanges && primaryKey && !hasValidationErrors)
              ? 'bg-[#34B27B] hover:bg-green-500'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`
          }
        >
          Sauvegarder
        </button>
        <button
          onClick={handleDelete}
          disabled={!primaryKey}
          className={`w-full bg-[#E45858] hover:bg-red-500 text-white font-semibold rounded-sm text-sm py-2.5 transition-colors ${!primaryKey ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};

export default InspectorPanel;