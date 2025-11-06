'use client';

import React, { useState, useEffect } from 'react';
import { Clock, KeyRound } from "lucide-react";

const validateProperty = (value, kuzuType) => {
    if (value === null || value === '' || value === undefined) return null;
    const strValue = String(value);
    const upperType = (kuzuType || '').toUpperCase();
    if (['INT64', 'INT32', 'INT16', 'INT8'].includes(upperType)) {
        if (!/^-?\d+$/.test(strValue)) return 'Doit être un nombre entier.';
    } else if (['DOUBLE', 'FLOAT'].includes(upperType)) {
        if (isNaN(parseFloat(strValue)) || !isFinite(Number(strValue))) return 'Doit être un nombre valide.';
    } else if (upperType === 'DATE') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(strValue)) return 'Format requis : YYYY-MM-DD.';
    } else if (upperType === 'TIMESTAMP') {
        if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(strValue)) return 'Format requis : YYYY-MM-DDTHH:MM:SS';
    }
    return null;
};

const InspectorPanel = ({ element, onClose, onSaveChanges, onDeleteElement }) => {
  const [properties, setProperties] = useState([]);
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
    if (!element || !schema) {
      setProperties([]);
      return;
    }

    const { label_type } = element.data;
    const tableSchema = element.isNode
      ? schema.nodeTables.find(t => t.name === label_type)
      : schema.relTables.find(t => t.name === label_type);

    let preparedProperties = [];

    if (tableSchema) {
      preparedProperties = tableSchema.properties.map(propSchema => {
        const originalValue = element.data.properties[propSchema.name];
        const upperType = (propSchema.type || 'STRING').toUpperCase();
        let currentValue = originalValue;
        
        if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
            currentValue = originalValue === true || String(originalValue).toLowerCase() === 'true';
        }
        
        return {
          key: propSchema.name,
          value: currentValue ?? '',
          originalValue: originalValue ?? '',
          type: propSchema.type,
          isPK: propSchema.isPrimaryKey || false,
        };
      });
      const pk = tableSchema.properties.find(p => p.isPrimaryKey);
      setPrimaryKey(pk ? pk.name : null);
    } else {
      console.warn(`Schéma non défini pour le label "${label_type}". Les types ne seront pas inférés.`);
      preparedProperties = Object.entries(element.data.properties).map(([key, value]) => ({
        key: key,
        value: value,
        originalValue: value,
        type: 'STRING',
        isPK: false,
      }));
      setPrimaryKey(null);
    }

    setProperties(preparedProperties);
    setHasChanges(false);
    setValidationErrors({});
  }, [element, schema]);

  useEffect(() => {
    if (properties.length === 0) return;
    const areDifferent = properties.some(prop => String(prop.value) !== String(prop.originalValue));
    setHasChanges(areDifferent);
  }, [properties]);

  const handlePropertyChange = (key, newValue) => {
    setProperties(currentProperties =>
      currentProperties.map(prop =>
        prop.key === key ? { ...prop, value: newValue } : prop
      )
    );

    const prop = properties.find(p => p.key === key);
    if (prop) {
      const errorMessage = validateProperty(newValue, prop.type);
      setValidationErrors(prev => ({ ...prev, [key]: errorMessage }));
    }
  };

  const handleSave = () => {
    if (!hasChanges || !primaryKey) return;

    const setClauses = properties
      .filter(prop => !prop.isPK && String(prop.value) !== String(prop.originalValue))
      .map(prop => {
        const kuzuType = (prop.type || 'STRING').toUpperCase();
        let formattedValue;
        if (prop.value === '' || prop.value === null || prop.value === undefined) {
          formattedValue = 'NULL';
        } else {
          const strValue = String(prop.value).replace(/'/g, "\\'");
          switch (kuzuType) {
            case 'INT64': case 'INT32': case 'INT16': case 'INT8':
            case 'DOUBLE': case 'FLOAT':
              formattedValue = prop.value; break;
            case 'BOOLEAN': case 'BOOL':
              formattedValue = (prop.value === true).toString(); break;
            case 'DATE':
              formattedValue = `DATE('${strValue}')`; break;
            case 'TIMESTAMP':
              formattedValue = `TIMESTAMP('${strValue}')`; break;
            default:
              formattedValue = `'${strValue}'`; break;
          }
        }
        return `item.${prop.key} = ${formattedValue}`;
      }).join(', ');

    if (!setClauses) return;
    
    const originalPrimaryKeyValue = element.data.properties[primaryKey];
    const primaryKeyValueFormatted = typeof originalPrimaryKeyValue === 'string' ? `'${String(originalPrimaryKeyValue).replace(/'/g, "\\'")}'` : originalPrimaryKeyValue;
    const updateQuery = `MATCH (item:${element.data.label_type} {${primaryKey}: ${primaryKeyValueFormatted}}) SET ${setClauses}`;
    onSaveChanges(updateQuery);
  };

  const handleDelete = () => {
    if (!onDeleteElement || !primaryKey) return;
    const { label_type } = element.data;
    const primaryKeyValue = element.data.properties[primaryKey];
    const primaryKeyValueFormatted = typeof primaryKeyValue === 'string' ? `'${String(primaryKeyValue).replace(/'/g, "\\'")}'` : primaryKeyValue;
    const deleteQuery = element.isNode ? `MATCH (item:${label_type} {${primaryKey}: ${primaryKeyValueFormatted}}) DETACH DELETE item` : `MATCH ()-[item:${label_type} {${primaryKey}: ${primaryKeyValueFormatted}}]->() DELETE item`;
    onDeleteElement(deleteQuery);
  };

  if (!element) return null;
  
  if (properties.length === 0 && element.data.properties && Object.keys(element.data.properties).length > 0) {
      return (
        <div className="flex flex-col h-full [background-color:#1A2127] [border-left:#2A2A2A_1px_solid] p-4 shadow-lg text-white">
          <div className="flex justify-center items-center h-full"><p className="text-gray-400">Chargement des détails...</p></div>
        </div>
      );
  }

  const { data, isNode } = element;
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
          <p className="text-xs p-2 bg-[#252F36] rounded-sm mt-1 text-gray-300">{data.kuzu_id ? `${data.kuzu_id.table}-${data.kuzu_id.offset}`: 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Label</label>
          <p className="p-2 bg-[#252F36] rounded-sm text-xs mt-1 text-gray-300">{data.label_type}</p>
        </div>
        <h4 className="font-semibold pt-2 border-t border-gray-700 text-gray-200">Propriétés</h4>
        
        {properties.map(prop => {
          const { key, value, type, isPK, originalValue } = prop;
          const upperType = (type || 'STRING').toUpperCase();
          const isBoolean = upperType === 'BOOLEAN' || upperType === 'BOOL';
          const isChecked = value === true;
          const isModified = String(value) !== String(originalValue);
          const error = validationErrors[key];

          return (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 capitalize">
                {isPK && <KeyRound className="w-3.5 h-3.5 text-[#34B27B]" />}
                <span>{key}</span>
              </label>

              {isBoolean ? (
                <div className="flex items-center mt-1 p-2 bg-[#252F36] rounded-sm">
                  <input type="checkbox" id={`checkbox-${key}`} checked={isChecked} onChange={(e) => handlePropertyChange(key, e.target.checked)} disabled={isPK} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-[#34B27B] focus:ring-[#34B27B]/50 cursor-pointer"/>
                  <label htmlFor={`checkbox-${key}`} className="ml-2 text-xs text-white select-none cursor-pointer">{isChecked ? 'Vrai' : 'Faux'}</label>
                  {!isPK && isModified && <Clock className="w-4 h-4 text-yellow-400 ml-auto" />}
                </div>
              ) : (
                <div className="relative w-full">
                    <input type="text" value={value ?? ""} onChange={(e) => handlePropertyChange(key, e.target.value)} readOnly={isPK} className={`w-full pr-8 mt-1 text-xs rounded-sm bg-[#252F36] border focus:outline-none focus:ring-2 transition-all duration-200 text-white p-2 ${isPK ? 'cursor-not-allowed opacity-70' : ''} ${error ? 'border-red-500 focus:ring-red-500/50' : isPK ? 'border-[#34B27B]/60 focus:ring-green-500/50' : 'border-transparent focus:ring-green-500/50'}`}/>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        {!isPK && isModified && <Clock className="w-4 h-4 text-yellow-400" />}
                    </div>
                </div>
              )}
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          );
        })}
      </div>

      <div className="pt-4 mt-2 border-t border-gray-700 space-y-3">
         <button onClick={handleSave} disabled={!hasChanges || !primaryKey || hasValidationErrors} className={`w-full transition-all duration-300 font-semibold text-white rounded-sm text-sm py-2.5 ${(hasChanges && primaryKey && !hasValidationErrors) ? 'bg-[#34B27B] hover:bg-green-500' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>Sauvegarder</button>
         <button onClick={handleDelete} disabled={!primaryKey} className={`w-full bg-[#E45858] hover:bg-red-500 text-white font-semibold rounded-sm text-sm py-2.5 transition-colors ${!primaryKey ? 'opacity-50 cursor-not-allowed' : ''}`}>Supprimer</button>
      </div>
    </div>
  );
};

export default InspectorPanel;