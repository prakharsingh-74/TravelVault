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
    <div className="flex-1 flex flex-col h-full overflow-hidden p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
          AI Travel Assistant
        </h1>
        <p className="text-sm text-[#a1a1aa]">
          Search your travel vault locally using natural language queries.
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col justify-between overflow-hidden mb-6">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white rounded-tr-none'
                    : 'bg-[#18181b] border border-[#27272a] text-[#e4e4e7] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-[#18181b] border border-[#27272a] rounded-2xl rounded-tl-none px-4 py-3 text-sm text-[#a1a1aa]">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="mt-4 pt-4 border-t border-[#27272a]/50">
          {messages.length === 1 && (
            <div className="mb-4">
              <span className="text-[10px] text-[#71717a] font-semibold block mb-2 uppercase tracking-wider">Suggestions</span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#27272a] bg-[#09090b] hover:bg-[#18181b] text-[#a1a1aa] hover:text-white transition-all"
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
              placeholder="Ask a question about passengers or travel docs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch(query);
              }}
              className="flex-1 bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#71717a] outline-none focus:border-[#8b5cf6] transition-colors"
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={isPending}
              className="px-5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
