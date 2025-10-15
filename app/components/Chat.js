'use client';

import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ onQuerySuccess, externalInput, setExternalInput }) => {
  const [mode, setMode] = useState('ai'); // 'ai' ou 'code'
  const [messages, setMessages] = useState([]); // { sender: 'user' ou 'bot', text: string }
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const input = externalInput;
  const setInput = setExternalInput;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    
    const queryToSend = input;
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
          body: JSON.stringify({ query: queryToSend }),
        });
        
        const data = await response.json();
        let botResponseText;

        if (response.ok) {
          onQuerySuccess(data.result, queryToSend); 
          botResponseText = `Résultat:\n${JSON.stringify(data.result, null, 2)}`;
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
          <button onClick={() => setMode('ai')} className={`flex items-center space-x-2 px-4 py-2 font-semibold transition-all duration-300 ${mode === 'ai' ? 'bg-purple-600 text-white dark:bg-purple-500' : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'}`}>AI</button>
          <button onClick={() => setMode('code')} className={`flex items-center space-x-2 px-4 py-2 font-semibold transition-all duration-300 ${mode === 'code' ? 'bg-blue-600 text-white dark:bg-blue-500' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>{"<\\>"}</button>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900">
        {messages.map((msg, index) => (
          <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'}`}>
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
            </div>
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