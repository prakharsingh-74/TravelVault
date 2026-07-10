'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your local TravelVault AI assistant. I can search through passenger profiles, travel documents, preferences, and details. Ask me anything!",
    },
  ]);
  const [isPending, setIsPending] = useState(false);

  const suggestions = [
    "Who prefers a lower berth?",
    "Show me Prakhar's details.",
    "Do we have any international passengers?",
    "Find details from uploaded passports."
  ];

  const handleSearch = async (text: string) => {
    if (!text.trim() || isPending) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsPending(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.error || 'No match found.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${e.message || 'Failed to get answer'}` },
      ]);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-8 max-w-4xl mx-auto w-full relative z-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 border-b border-border-main pb-6">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-text-title to-text-muted bg-clip-text text-transparent">
          AI Travel Assistant
        </h1>
        <p className="text-xs text-text-muted">
          Search passenger database and document OCR indices locally in natural language.
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col justify-between overflow-hidden mb-6 border border-border-main">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 scroll-smooth">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 items-start ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                m.role === 'user'
                  ? 'bg-input-bg border border-input-border text-text-title'
                  : 'bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6]'
              }`}>
                {m.role === 'user' ? (
                  <span>U</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a11.963 11.963 0 01-2.912-1.928m0 0l-1.352-4.361m1.352 4.361a11.954 11.954 0 01-3.427-3.79M3.77 12.048l1.353-4.36m-1.353 4.36a11.948 11.948 0 01-1.927-2.912L5.474 4m0 0A12.07 12.07 0 018 2.052M8 2.052V7m0-4.948a12.07 12.07 0 013.784 1.76l2.122 5.03m-2.122-5.03c.53.224 1.043.484 1.537.777m0 0l4.36-1.353M17.3 3.77a11.948 11.948 0 012.912 1.927m0 0l1.352 4.361m-1.352-4.361a11.954 11.954 0 013.427 3.79M20.23 11.952l-1.353 4.36m1.353-4.36a11.948 11.948 0 011.927 2.912L18.526 20m0 0a12.07 12.07 0 01-2.526 1.948M16 21v-4.948a12.07 12.07 0 01-3.784-1.76l-2.122-5.03m2.122 5.03c-.53-.224-1.043-.484-1.537-.777m0 0L4.829 14.86" />
                  </svg>
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2.5 text-xs leading-relaxed border ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[#8b5cf6]/20 to-[#3b82f6]/20 border-[#8b5cf6]/25 text-text-title'
                    : 'bg-white/[0.02] dark:bg-white/[0.02] light:bg-black/[0.02] border-border-main text-app-fg'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}

          {/* Thinking status */}
          {isPending && (
            <div className="flex gap-3 items-start animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6] flex items-center justify-center shrink-0 font-bold text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a11.963 11.963 0 01-2.912-1.928m0 0l-1.352-4.361m1.352 4.361a11.954 11.954 0 01-3.427-3.79M3.77 12.048l1.353-4.36m-1.353 4.36a11.948 11.948 0 01-1.927-2.912L5.474 4m0 0A12.07 12.07 0 018 2.052M8 2.052V7m0-4.948a12.07 12.07 0 013.784 1.76l2.122 5.03m-2.122-5.03c.53.224 1.043.484 1.537.777m0 0l4.36-1.353M17.3 3.77a11.948 11.948 0 012.912 1.927m0 0l1.352 4.361m-1.352-4.361a11.954 11.954 0 013.427 3.79M20.23 11.952l-1.353 4.36m1.353-4.36a11.948 11.948 0 011.927 2.912L18.526 20m0 0a12.07 12.07 0 01-2.526 1.948M16 21v-4.948a12.07 12.07 0 01-3.784-1.76l-2.122-5.03m2.122 5.03c-.53-.224-1.043-.484-1.537-.777m0 0L4.829 14.86" />
                </svg>
              </div>
              <div className="bg-white/[0.02] dark:bg-white/[0.02] light:bg-black/[0.02] border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-muted">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[11px] font-medium">Analyzing vector space...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="mt-4 pt-4 border-t border-border-main">
          {messages.length === 1 && (
            <div className="mb-4">
              <span className="text-[9px] text-text-muted font-bold block mb-2 uppercase tracking-widest">Suggestions</span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(s)}
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-border-main bg-white/[0.01] dark:bg-white/[0.01] light:bg-black/[0.01] hover:bg-white/[0.04] dark:hover:bg-white/[0.04] light:hover:bg-black/[0.02] text-text-muted hover:text-text-title transition-all cursor-pointer font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a travel preference query (e.g. 'Who prefers vegetarian meals?')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch(query);
              }}
              className="flex-1 bg-input-bg border border-input-border rounded-xl px-4 py-3 text-xs text-text-title placeholder-text-muted outline-none focus:border-[#8b5cf6] transition-colors font-medium"
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={isPending || !query.trim()}
              className="px-5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 disabled:opacity-40 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Send</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L6 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
