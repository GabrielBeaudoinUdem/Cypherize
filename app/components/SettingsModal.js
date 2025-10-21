'use client';

import { useState, useEffect } from 'react';

const SettingsModal = ({ isOpen, onClose, config, onSave }) => {
  const [tempConfig, setTempConfig] = useState(config);

  useEffect(() => {
    setTempConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(tempConfig);
    onClose();
  };

  const handleInputChange = (field, value) => {
    setTempConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI model provider configuration</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="ai-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API URL
            </label>
            <input
              id="ai-url"
              type="text"
              value={tempConfig.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="http://localhost:1234/v1/chat/completions"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white transition-all duration-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>
           <div>
            <label htmlFor="ai-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI model
            </label>
            <input
              id="ai-model"
              type="text"
              value={tempConfig.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="ex: openai/gpt-oss-20b"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white transition-all duration-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;