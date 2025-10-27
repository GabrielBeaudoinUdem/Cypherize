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
    <div className="relative flex flex-col h-full rounded-none bg-[#171717] [border-left:#2A2A2A_1px_solid]">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onSave={onAiConfigChange}
      />


      {/* Header */}
      <div className="flex items-center p-4 dark:border-gray-700 bg-[#20282E] gap-3">
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
        <BDActionsButtons/>
        <div className="flex-grow flex justify-end">
          <div className="flex items-center bg-[#1E252B] border border-gray-600 rounded-3xl overflow-hidden text-sm">
            <button onClick={() => setMode('ai')} className={`flex items-center space-x-2 px-4 py-2 font-semibold transition-all duration-300 ${mode === 'ai' ? 'bg-[#34B27B] text-white' : 'text-gray-600 dark:text-gray-300 hover:text-white'}`}>AI</button>
            <button onClick={() => setMode('code')} className={`flex items-center space-x-2 px-3 py-2 font-semibold transition-all duration-300 ${mode === 'code' ? 'bg-[#34B27B] text-white' : 'text-gray-600 dark:text-gray-300 hover:text-white'}`}>{"<\\>"}</button>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 p-6 overflow-y-auto [background-color:#1A2127]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'text' && (
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-[#34B27B] text-white' : 'bg-[#252F36] text-gray-900 dark:text-white'}`}>
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
      <div className="flex-shrink-0 px-4 py-3 [background-color:#1A2127]">
        <form onSubmit={handleSendMessage} className="w-full max-w-3xl mx-auto px-3 sm:px-4">
          <div className="flex items-end gap-2 sm:gap-3 rounded-3xl sm:rounded-3xl bg-white dark:bg-[#20282E] border border-zinc-200 dark:border-zinc-700/70 focus-within:ring-2 focus-within:ring-zinc-300/70 dark:focus-within:ring-zinc-700/60 pl-4 pr-1 py-1 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "ai" ? "Posez une question..." : "Entrez une requête Cypher..."}
              rows={1}
              className="flex-1 resize-none outline-none bg-transparent text-[15px] leading-6 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 max-h-48 py-1.5"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`inline-flex items-center justify-center shrink-0 h-9 w-9 rounded-full transition-opacity shadow ${
                !input.trim() || isLoading
                  ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
                  : "bg-black text-white dark:bg-zinc-200 dark:text-zinc-900 hover:opacity-90"
              }`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M5 12h9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path
                  d="M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;