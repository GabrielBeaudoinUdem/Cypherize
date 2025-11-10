'use client';

import React, { useState, useRef, useEffect } from 'react';
import SettingsButton from './SettingsButton';
import SettingsModal from './SettingsModal';
import QueryConfirmation from './QueryConfirmation';
import BDActionsButtons from './BDActionsButtons';
import AiAnswer from './AiAnswer';
import { CheckCircle, AlertCircle  } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { looksLikeCypher } from '@/lib/looksLikeCypher';
import MentionTextarea from './MentionTextarea';

const Chat = ({ onQuerySuccess, externalInput, setExternalInput, aiConfig, onAiConfigChange, executeQuery, lastQuery, ghost, setLoading }) => {
  const [mode, setMode] = useState('ai'); // 'ai' ou 'code'
  const [messages, setMessages] = useState([]); // { id, sender, type, content }
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputWarning, setInputWarning] = useState(0);
  const messagesEndRef = useRef(null);

  const input = externalInput;
  const setInput = setExternalInput;

  useEffect(() => {
    if (input.length > 0) {
      if (mode === 'ai' && looksLikeCypher(input)) {
        setInputWarning(1)
      } else if (mode === 'code' && input.length > 5 && !looksLikeCypher(input)) {
        setInputWarning(2)
      } else {
        setInputWarning(0)
      }
    } else {
      setInputWarning(0)
    }
  }, [input])

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
        console.log(response)
        throw new Error(result.error || "Erreur de l'API AI");
      }

      if (result.type === 'confirmation') {
        addMessage('bot', 'confirmation', { query: result.query });
      } else if (result.type === 'answer') {
        addMessage('bot', 'answer', { text: result.text, query: result.query, data: result.data });
        if (payload.confirmedQuery) {
            isSuccess = result.success === true;
        }
      }

    } catch (error) {
      console.error("Erreur API AI:", error);
      addMessage('bot', 'error', `${error.message}`);
      isSuccess = false;
    } finally {
      setIsLoading(false);
      return isSuccess;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setLoading(true)

    addMessage('user', mode, input);
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
          addMessage('bot', 'success', `\n${JSON.stringify(data.result, null, 2)}`);
        } else {
          addMessage('bot', 'error', `${data.error}`);
        }
      } catch (error) {
        addMessage('bot', 'error', `${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    setLoading(false)
  };

  const handleConfirmQuery = async (query) => {
    setMessages(prev => prev.map(m =>
        m.type === 'confirmation' ? { ...m, content: { ...m.content, confirmed: true, query } } : m
    ));

    const wasSuccessful = await handleAiInteraction({ config: aiConfig, confirmedQuery: query });

    if (wasSuccessful && lastQuery) {
        try {
            addMessage('bot', 'success', 'Mise à jour du graphe...');
            const freshResult = await executeQuery(lastQuery);
            onQuerySuccess(freshResult, lastQuery);
        } catch (error) {
            addMessage('bot', 'error', `Erreur lors de la mise à jour du graphe: ${error.message}`);
        }
    } else if (wasSuccessful && !lastQuery) {
        onQuerySuccess([], '');
    }
  };

  const handleCancelQuery = (messageId) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      addMessage('bot', 'text', 'Opération annulée.');
  };

  function transformMentions(msg) {
    return msg
      .replace(/@\[(.*?)\]\((.*?)\)/g, '<span style="color:rgba(52, 178, 123, 1);font-weight:bold;">@$1</span>')
      .replace(/#\[(.*?)\]\((.*?)\)/g, '<span style="color:rgba(52, 178, 123, 1);font-weight:bold;">#$1</span>');
  }

  return (
    <div className="relative flex flex-col h-full rounded-none bg-[#171717] [border-left:#2A2A2A_1px_solid]">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onSave={onAiConfigChange}
      />


      {/* Header */}
      <div className="flex items-center p-4 border-gray-700 bg-[#20282E] gap-3">
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
        <BDActionsButtons onQuerySuccess={onQuerySuccess} />

        <div className="flex-grow flex justify-end">
          <div
            className="relative isolate w-[110px] h-10 rounded-xl border border-[#2A3239] bg-[#1A2127] shadow-sm overflow-hidden"
            role="tablist"
            aria-label="Sélecteur de mode"
          >
            {/* Curseur glissant */}
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-[#34B27B] shadow-sm
                          transition-transform duration-300 ease-out
                          motion-reduce:transition-none
                          ${mode === 'code' ? 'translate-x-full' : 'translate-x-0'}`}
            />

            <div className="grid grid-cols-2 h-full relative z-10">
              <button
                type="button"
                onClick={() => setMode('ai')}
                role="tab"
                aria-selected={mode === 'ai'}
                className={`px-2 text-sm font-semibold transition-colors duration-200
                            ${mode === 'ai'
                              ? 'text-[#0B1215]'
                              : 'text-zinc-400 hover:text-white'}`}
                title="Mode conversation IA"
              >
                AI
              </button>

              <button
                type="button"
                onClick={() => setMode('code')}
                role="tab"
                aria-selected={mode === 'code'}
                className={`px-2 text-sm font-semibold transition-colors duration-200
                            ${mode === 'code'
                              ? 'text-[#0B1215]'
                              : 'text-zinc-400 hover:text-white'}`}
                title="Mode requête code"
              >
                {"</>"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 p-6 overflow-y-auto [background-color:#1A2127]">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="w-full max-w-lg text-center text-zinc-400">
              {/* Médaillon + icône */}
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#1A2127] ring-1 ring-[#2A3239]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#34B27B]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h3m-3-8V4a1 1 0 011-1h8a1 1 0 011 1v4m4 0v8a1 1 0 01-1 1h-3l-4 4-4-4H5a1 1 0 01-1-1V8h16z"/>
                </svg>
              </div>

              {/* Titre + sous-titre */}
              <h3 className="text-white font-semibold tracking-tight">
                Welcome to <span className="text-[#34B27B]">Cypherize</span>
              </h3>
              <p className="mt-1 text-sm">
                Ask a question in natural language or write a <span className="font-mono text-[#34B27B]">Cypher</span> query.
              </p>


              {/* Suggestions */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof setExternalInput === 'function') {
                      setMode('ai');
                      setExternalInput('How many nodes does this graph have ?');
                    }
                  }}
                  className="rounded-full border border-[#2A3239] bg-[#1A2127] px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#20282E] hover:text-white transition"
                >
                  Number of nodes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof setExternalInput === 'function') {
                      setMode('ai');
                      setExternalInput('How many edges does this graph have ?');
                    }
                  }}
                  className="rounded-full border border-[#2A3239] bg-[#1A2127] px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#20282E] hover:text-white transition"
                >
                  Number of edges
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof setExternalInput === 'function') {
                      setMode('code');
                      setExternalInput('MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m');
                    }
                  }}
                  className="rounded-full border border-[#2A3239] bg-[#1A2127] px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#20282E] hover:text-white transition"
                >
                  Show full graph
                </button>
              </div>

              {/* Aide clavier */}
              {/*<div className="mt-4 text-[11px] text-zinc-500">
                Entrée&nbsp;: envoyer • Maj+Entrée&nbsp;: nouvelle ligne
              </div>
              */}
            </div>
          </div>
        ) : (
          <>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'ai' && (
                <div
                  className={`max-w-[80%] ${
                    msg.sender === 'user'
                      ? 'bg-[#252F36] text-white px-4 py-2 rounded-2xl'
                      : 'text-white'
                  }`}
                >
                  <div
                    className="whitespace-pre-wrap font-sans text-sm"
                    dangerouslySetInnerHTML={{
                      __html: transformMentions(msg.content),
                    }}
                  />
                </div>
              )}

              {msg.type === 'answer' && (
                <div className="w-full">
                  <AiAnswer content={msg.content} />
                </div>
              )}

              {msg.type === 'text' && (
                <div className={`max-w-[80%] px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'border border-[#2A3239] text-white'}`}>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                </div>
              )}

              {msg.type === 'code' && (
                <div className={`max-w-[80%] ${msg.sender === 'user' ? 'bg-[#252F36] text-white px-1.5 py-0 rounded-[6px]' : 'text-white'}`}>
                  <SyntaxHighlighter
                    language="cypher"
                    style={tomorrow}
                    wrapLongLines
                    PreTag="div"
                    customStyle={{
                      background: "#11181C",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      padding: "12px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflow: "hidden",     // pas de scrollbar
                    }}
                    codeTagProps={{
                      style: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
                    }}
                  >
                    {msg.content}
                  </SyntaxHighlighter>

                </div>
              )}

              {msg.type === "success" && (
                <div className="w-full max-w-lg mx-auto">
                  <div
                    className="flex items-center justify-between px-0 py-1 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#34B27B]" />
                      <span className="font-normal text-[#34B27B] text-sm">Query executed successfully.</span>
                    </div>
                  </div>
                </div>
              )}
              {msg.type === "error" && (
                <div className="w-full max-w-lg mx-auto">
                  <div className="flex items-center justify-between px-0 py-1 transition-all">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#E45858]" />
                      <span className="font-normal text-[#E45858] text-sm">
                        Error : {msg.content}
                      </span>
                    </div>
                  </div>
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
                      <div className="bg-[#252F36] rounded-sm p-2 my-2 border-l-4 border-[#34B27B]">
                          <SyntaxHighlighter
                            language="cypher"
                            style={tomorrow}
                            wrapLongLines
                            PreTag="div"
                            customStyle={{
                              background: "#11181C",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontFamily: "monospace",
                              padding: "12px",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              overflow: "hidden",
                            }}
                            codeTagProps={{
                              style: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
                            }}
                          >
                            {msg.content.query}
                          </SyntaxHighlighter>
                      </div>
                  </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-start gap-2 mb-3">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-700"
                style={{ borderTopColor: "#34B27B" }}
                aria-label="Loading"
                role="status"
              />
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>

      {/* Zone de saisie */}
      <div className="flex-shrink-0 px-4 [background-color:#1A2127]">
        <form id="mention-textarea-zone" onSubmit={handleSendMessage} className="w-full max-w-3xl mx-auto px-3 sm:px-4">
          <div
            className={`
                flex items-end gap-2 sm:gap-3 rounded-3xl sm:rounded-3xl pl-4 pr-1 py-1 transition-colors transition-transform duration-600
                ${(ghost) ? '[border:#34B27B_solid_1px] transform scale-102 bg-[rgba(52,178,123,.1)]' : 'bg-[#20282E] border border-zinc-700/70'}
              `}
          >
              <MentionTextarea
                value={input}
                onChange={setInput}
                placeholder={mode === "ai" ? "Ask a question..." : "Enter a Cypher query..."}
                disabled={false}
                mode="ai"
              />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`inline-flex items-center justify-center shrink-0 h-9 w-9 rounded-full transition-opacity shadow ${
                !input.trim() || isLoading
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-200 text-zinc-900 hover:opacity-90"
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

        <div className="my-1 text-[11px] text-zinc-400/50 text-center">
              {(inputWarning == 0) && ( <>Cypherize can make mistakes. Please check answers.</> )}

              { (inputWarning == 1) && (
                <>
                  That looks like Cypher...
                  <span
                    className="text-[#34B27B] pl-1 opacity-80 hover:opacity-100 cursor-default duration-100"
                    onClick={() => { setMode('code'); setInputWarning(0); }}
                  >
                    Switch mode ?
                  </span>
                </>
              ) }

              { (inputWarning == 2) && (
                <>
                  That doesn't look like Cypher...
                  <span
                    className="text-[#34B27B] pl-1 opacity-80 hover:opacity-100 cursor-default duration-100"
                    onClick={() => { setMode('ai'); setInputWarning(0); }}
                  >
                    Switch mode ?
                  </span>
                </>
              ) }
        </div>
      </div>
    </div>
  );
};

export default Chat;