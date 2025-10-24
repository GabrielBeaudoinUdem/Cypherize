'use client';

import React, { useState, useRef, useEffect } from 'react';
import SettingsButton from './SettingsButton';
import SettingsModal from './SettingsModal';
import QueryConfirmation from './QueryConfirmation';
import BDActionsButtons from './BDActionsButtons';

const Chat = ({ onQuerySuccess, externalInput, setExternalInput, aiConfig, onAiConfigChange, executeQuery, lastQuery }) => {
  const [mode, setMode] = useState('ai'); // 'ai' ou 'code'
  const [messages, setMessages] = useState([]); // { id, sender, type, content }
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  
  const input = externalInput;
  const setInput = setExternalInput;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, type, content) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setMessages(prev => [...prev, { id: uniqueId, sender, type, content }]);
  };

  const handleAiInteraction = async (payload) => {
    setIsLoading(true);
    let isSuccess = false;
    try {
      const response = await fetch("/api/ai", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erreur de l'API AI");
      }
      
      if (result.type === 'confirmation') {
        addMessage('bot', 'confirmation', { query: result.query });
      } else if (result.type === 'answer') {
        addMessage('bot', 'text', result.text);
        if (payload.confirmedQuery) {
            isSuccess = result.success === true;
        }
      }

    } catch (error) {
      console.error("Erreur API AI:", error);
      addMessage('bot', 'text', `Erreur: ${error.message}`);
      isSuccess = false;
    } finally {
      setIsLoading(false);
      return isSuccess;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    addMessage('user', 'text', input);
    const queryToSend = input;
    setInput('');

    if (mode === 'ai') {
      // Mode AI
      await handleAiInteraction({ config: aiConfig, prompt: queryToSend });
    } else {
      // Mode Code
      setIsLoading(true);
      try {
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryToSend }),
        });
        const data = await response.json();
        if (response.ok) {
          onQuerySuccess(data.result, queryToSend);
          addMessage('bot', 'text', `Résultat:\n${JSON.stringify(data.result, null, 2)}`);
        } else {
          addMessage('bot', 'text', `Erreur: ${data.error}`);
        }
      } catch (error) {
        addMessage('bot', 'text', `Erreur: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleConfirmQuery = async (query) => {
    setMessages(prev => prev.map(m => 
        m.type === 'confirmation' ? { ...m, content: { ...m.content, confirmed: true, query } } : m
    ));
    
    const wasSuccessful = await handleAiInteraction({ config: aiConfig, confirmedQuery: query });

    if (wasSuccessful && lastQuery) {
        try {
            addMessage('bot', 'text', 'Mise à jour du graphe...');
            const freshResult = await executeQuery(lastQuery);
            onQuerySuccess(freshResult, lastQuery);
        } catch (error) {
            addMessage('bot', 'text', `Erreur lors de la mise à jour du graphe: ${error.message}`);
        }
    } else if (wasSuccessful && !lastQuery) {
        onQuerySuccess([], '');
    }
  };
  
  const handleCancelQuery = (messageId) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      addMessage('bot', 'text', 'Opération annulée.');
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-br from-white to-gray-200 dark:from-gray-900 dark:to-gray-800 border-l shadow-lg rounded-lg">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onSave={onAiConfigChange}
      />

      {/* Header */}
      <div className="flex items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-3">
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
        <BDActionsButtons/>
        <div className="flex-grow flex justify-end">
          <div className="flex items-center bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <button onClick={() => setMode('ai')} className={`flex items-center space-x-2 px-4 py-2 font-semibold transition-all duration-300 ${mode === 'ai' ? 'bg-purple-600 text-white dark:bg-purple-500' : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'}`}>AI</button>
            <button onClick={() => setMode('code')} className={`flex items-center space-x-2 px-4 py-2 font-semibold transition-all duration-300 ${mode === 'code' ? 'bg-blue-600 text-white dark:bg-blue-500' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>{"<\\>"}</button>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'text' && (
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'}`}>
                <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
              </div>
            )}
            {msg.type === 'confirmation' && !msg.content.confirmed && (
                <div className="w-full">
                    <QueryConfirmation 
                        query={msg.content.query}
                        onConfirm={handleConfirmQuery}
                        onCancel={() => handleCancelQuery(msg.id)}
                    />
                </div>
            )}
             {msg.type === 'confirmation' && msg.content.confirmed && (
                 <div className="w-full my-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-green-500 opacity-70">
                        <p className="text-sm italic text-gray-600 dark:text-gray-300">Requête exécutée :</p>
                        <pre className="mt-2 bg-gray-800 dark:bg-gray-900 text-white p-2 rounded-md text-xs font-mono whitespace-pre-wrap"><code>{msg.content.query}</code></pre>
                    </div>
                 </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="max-w-[70%] px-4 py-2 rounded-2xl shadow-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white animate-pulse rounded-bl-none">...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'ai' ? "Posez une question..." : "Entrez une requête Cypher..."}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none dark:bg-gray-800 dark:text-white transition-all duration-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button type="submit" className={`btn rounded-lg shadow-md px-6 font-semibold transition-all duration-300 ${mode === 'code' ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-purple-600 text-white dark:bg-purple-500'}`} disabled={isLoading}>{">"}</button>
        </form>
      </div>
    </div>
  );
};

export default Chat;