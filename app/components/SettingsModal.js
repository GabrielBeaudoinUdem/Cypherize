'use client';

import { useState, useEffect } from 'react';

const SettingsModal = ({ isOpen, onClose, config, onSave }) => {
  const [tempConfig, setTempConfig] = useState(config);

  useEffect(() => {
    setTempConfig(config);
  }, [config, isOpen]);

  const handleSave = () => {
    onSave(tempConfig);
    onClose();
  };

  const handleInputChange = (field, value) => {
    setTempConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300
        ${isOpen ? 'opacity-100 bg-[rgba(17,24,28,0.8)] backdrop-blur-sm pointer-events-auto'
                : 'opacity-0 bg-[rgba(17,24,28,0)] pointer-events-none'}`}
    >
      <div
        className={`w-full max-w-md mx-4 p-6 rounded-lg border shadow-xl transform transition-all duration-300
          bg-[#1A2127] border-[#2A2A2A] dark:border-gray-700
          ${isOpen ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-2'}`}
      >
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
              className="w-full px-3 py-2 border rounded-sm focus:outline-none bg-[rgba(17,24,28,.5)] dark:text-white transition-all duration-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border rounded-sm focus:outline-none bg-[rgba(17,24,28,.5)] dark:text-white transition-all duration-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-sm bg-[#34B27B] text-white font-semibold hover:bg-[#3BCF92] transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;