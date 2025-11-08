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

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300
        ${isOpen ? 'opacity-100 bg-[rgba(17,24,28,0.8)] backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md mx-4 p-6 rounded-lg border shadow-xl transform transition-all duration-300
          bg-[#1A2127] border-[#2A3239]
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">AI Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="ai-url" className="block text-sm font-medium text-gray-300 mb-1">
              API URL
            </label>
            <input
              id="ai-url"
              type="text"
              value={tempConfig.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="http://localhost:1234/v1/chat/completions"
              className="w-full px-3 py-2 rounded-md focus:outline-none bg-[#252F36] text-white transition-all duration-200 border border-[#2A3239] focus:ring-2 focus:ring-[#34B27B]/50 placeholder:text-gray-500"
            />
          </div>
           <div>
            <label htmlFor="ai-model" className="block text-sm font-medium text-gray-300 mb-1">
              AI model
            </label>
            <input
              id="ai-model"
              type="text"
              value={tempConfig.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="ex: mistralai/devstral"
              className="w-full px-3 py-2 rounded-md focus:outline-none bg-[#252F36] text-white transition-all duration-200 border border-[#2A3239] focus:ring-2 focus:ring-[#34B27B]/50 placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239] hover:text-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-[#34B27B] text-[#0B1215] font-semibold hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;