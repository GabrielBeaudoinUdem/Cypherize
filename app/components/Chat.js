'use client';

import React, { useState, useRef, useEffect } from 'react';

const Chat = () => {
  const [mode, setMode] = useState('ai'); // 'ai' ou 'code'
  const [messages, setMessages] = useState([]); // { sender: 'user' ou 'bot', text: string }
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (mode === 'ai') {
      // Mode AI
      //TODO: Intégrer l'API AI
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: 'allo' }]);
        setIsLoading(false);
      }, 500);
    } else {
      // Mode Code
      try {
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input }),
        });
        
        const data = await response.json();

        let botResponseText;
        if (response.ok) {
          botResponseText = `Résultat:\n\`\`\`json\n${JSON.stringify(data.result, null, 2)}\n\`\`\``;
        } else {
          botResponseText = `Erreur: ${data.error}`;
        }
        setMessages(prev => [...prev, { sender: 'bot', text: botResponseText }]);

      } catch (error) {
        setMessages(prev => [...prev, { sender: 'bot', text: `Erreur: ${error.message}` }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white to-gray-200 dark:from-gray-900 dark:to-gray-800 border-l shadow-lg rounded-lg">
      {/* Sélecteur de mode */}
      <div className="flex justify-end p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setMode('ai')}
            className={`flex items-center space-x-2 px-4 py-2 font-semibold transition-all duration-300 ${
              mode === 'ai'
                ? 'bg-purple-600 text-white dark:bg-purple-500'
                : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
            }`}
          >
            <span>AI</span>
          </button>
          <button
            onClick={() => setMode('code')}
            className={`flex items-center space-x-2 px-4 py-2 font-semibold transition-all duration-300 ${
              mode === 'code'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <span>{"<\\>"}</span>
          </button>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-md
                ${msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="max-w-[70%] px-4 py-2 rounded-2xl shadow-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white animate-pulse rounded-bl-none">
              ...
            </div>
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
            placeholder={mode === 'ai' ? "Posez n'importe quelle question..." : "Entrez une requête Cypher..."}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`btn rounded-lg shadow-md px-6 font-semibold transition-all duration-300 ${
              mode === 'ai'
                ? 'bg-purple-600 text-white dark:bg-purple-500'
                : 'bg-blue-600 text-white dark:bg-blue-500'
            }`}
            disabled={isLoading}
          >
            {">"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;