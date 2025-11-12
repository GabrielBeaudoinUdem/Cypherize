'use client';

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const providers = [
  { id: 'lmstudio', name: 'LM Studio', requiresKey: false },
  { id: 'mistral', name: 'Mistral', requiresKey: true },
  // { id: 'openai', name: 'OpenAI', requiresKey: true },
  // { id: 'gemini', name: 'Gemini', requiresKey: true },
  // { id: 'claude', name: 'Claude', requiresKey: true },

];

const providersRequiringKey = providers
  .filter(p => p.requiresKey)
  .map(p => p.id);

const SettingsModal = ({ isOpen, onClose, config, onSave }) => {
  const [tempConfig, setTempConfig] = useState(config);
  const [activeProvider, setActiveProvider] = useState(config.provider);

  useEffect(() => {
    setTempConfig(config);
    setActiveProvider(config.provider);
  }, [config, isOpen]);

  const handleSave = () => {
    if (providersRequiringKey.includes(activeProvider)) {
      const key = tempConfig[activeProvider]?.apiKey?.trim();
      if (!key) {
        toast.error("Vous n'avez pas entré de clé API pour le fournisseur sélectionné.");
        return;
      }
    }

    onSave({ ...tempConfig, provider: activeProvider });
    onClose();
  };


  const handleInputChange = (provider, field, value) => {
    setTempConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };
  
  const renderProviderSettings = () => {
    switch (activeProvider) {
      case 'lmstudio':
        return (
          <>
            <div>
              <label htmlFor="ai-url" className="block text-sm font-medium text-gray-300 mb-1">API URL</label>
              <input
                id="ai-url" type="text" value={tempConfig.lmstudio.url}
                onChange={(e) => handleInputChange('lmstudio', 'url', e.target.value)}
                placeholder="http://localhost:1234/v1/chat/completions"
                className="w-full px-3 py-2 rounded-md focus:outline-none bg-[#252F36] text-white transition-all duration-200 border border-[#2A3239] focus:ring-2 focus:ring-[#34B27B]/50 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label htmlFor="ai-model" className="block text-sm font-medium text-gray-300 mb-1">AI Model</label>
              <input
                id="ai-model" type="text" value={tempConfig.lmstudio.model}
                onChange={(e) => handleInputChange('lmstudio', 'model', e.target.value)}
                placeholder="e.g., mistralai/devstral"
                className="w-full px-3 py-2 rounded-md focus:outline-none bg-[#252F36] text-white transition-all duration-200 border border-[#2A3239] focus:ring-2 focus:ring-[#34B27B]/50 placeholder:text-gray-500"
              />
            </div>
          </>
        );
      case 'mistral':
      // case 'openai':
      // case 'gemini':
      // case 'claude':
        const providerConfig = tempConfig[activeProvider];
        return (
           <>
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
              <input
                id="api-key" type="password" value={providerConfig.apiKey}
                onChange={(e) => handleInputChange(activeProvider, 'apiKey', e.target.value)}
                placeholder={`Enter your ${providers.find(p => p.id === activeProvider).name} API Key`}
                className="w-full px-3 py-2 rounded-md focus:outline-none bg-[#252F36] text-white transition-all duration-200 border border-[#2A3239] focus:ring-2 focus:ring-[#34B27B]/50 placeholder:text-gray-500"
              />
            </div>
             <div>
              <label htmlFor="ai-model" className="block text-sm font-medium text-gray-300 mb-1">AI Model</label>
              <input
                id="ai-model" type="text" value={providerConfig.model}
                onChange={(e) => handleInputChange(activeProvider, 'model', e.target.value)}
                placeholder={providerConfig.model}
                className="w-full px-3 py-2 rounded-md focus:outline-none bg-[#252F36] text-white transition-all duration-200 border border-[#2A3239] focus:ring-2 focus:ring-[#34B27B]/50 placeholder:text-gray-500"
              />
            </div>
          </>
        );
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-[rgba(17,24,28,0.8)] backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md mx-4 p-6 rounded-lg border shadow-xl transform transition-all duration-300 bg-[#1A2127] border-[#2A3239] ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">AI Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="mb-6 border-b border-[#2A3239]">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setActiveProvider(provider.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeProvider === provider.id
                    ? 'border-[#34B27B] text-[#34B27B]'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {config.provider === provider.id && <CheckCircle className="w-4 h-4 text-[#34B27B]" />}
                {provider.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          {renderProviderSettings()}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239] hover:text-white transition-colors font-medium">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md bg-[#34B27B] text-[#0B1215] font-semibold hover:opacity-90 transition-opacity">Save</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;