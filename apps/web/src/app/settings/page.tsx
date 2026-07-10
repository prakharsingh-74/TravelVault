'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [aiStatus, setAiStatus] = useState('Checking...');

  useEffect(() => {
    fetchSettings();
    checkHealth();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.gemini_api_key) setGeminiKey(data.gemini_api_key);
      if (data.groq_api_key) setGroqKey(data.groq_api_key);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const checkHealth = async () => {
    // Check DB Status
    try {
      const res = await fetch('/api/passengers');
      if (res.ok) {
        setDbStatus('Connected (SQLite Local)');
      } else {
        setDbStatus('Error connecting to database');
      }
    } catch (e) {
      setDbStatus('Database offline');
    }

    // Check AI Engine Status
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      
      if (data.groq_api_key) {
        setAiStatus('Active (Groq Cloud Engine)');
      } else if (data.gemini_api_key) {
        setAiStatus('Active (Gemini Engine)');
      } else {
        setAiStatus('Active (Mock/Fallback mode - enter an API key below)');
      }
    } catch (e) {
      setAiStatus('Status unknown');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            gemini_api_key: geminiKey,
            groq_api_key: groqKey,
            groq_model: 'llama-3.3-70b-versatile'
          }
        }),
      });

      if (res.ok) {
        alert('Configurations saved successfully.');
        checkHealth();
      } else {
        alert('Failed to save configuration.');
      }
    } catch (e) {
      alert('Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDb = async () => {
    if (!confirm('WARNING: This will delete ALL passengers, travel documents, and local AI memory indices permanently. Are you sure you want to continue?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        alert('Local database wiped successfully.');
        checkHealth();
      } else {
        alert('Failed to reset database.');
      }
    } catch (e) {
      alert('Error during reset.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-text-title to-text-muted bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Configure API keys, manage local databases, and check engine health.
        </p>
      </div>

      {/* System Health Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-semibold text-text-title">System Engine Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-input-bg border border-input-border p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-text-muted text-xs block mb-1">Local Database</span>
              <span className="font-semibold text-text-title">{dbStatus}</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${dbStatus.includes('Connected') ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></span>
          </div>

          <div className="bg-input-bg border border-input-border p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-text-muted text-xs block mb-1">Active AI Engine</span>
              <span className="font-semibold text-text-title">{aiStatus}</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${aiStatus.includes('Engine)') ? 'bg-emerald-400' : 'bg-yellow-400'}`}></span>
          </div>
        </div>
      </div>

      {/* API Key Panel */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-semibold text-text-title">AI Engine Settings</h2>
        <p className="text-xs text-text-muted">
          Paste your API key directly from Gemini or Groq Cloud to activate semantic travel searches and indexing. The engine automatically switches to whichever key you populate.
        </p>
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Stacked Key Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1.5 font-sans">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter Gemini API key (AIzaSy...)"
                  className="w-full bg-input-bg border border-input-border rounded-lg p-2.5 pr-10 text-sm text-text-title focus:outline-none focus:border-[#8b5cf6] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-3 text-text-muted hover:text-text-title transition-colors"
                >
                  {showGeminiKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1.5 font-sans">Groq API Key</label>
              <div className="relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="Enter Groq API key (gsk_...)"
                  className="w-full bg-input-bg border border-input-border rounded-lg p-2.5 pr-10 text-sm text-text-title focus:outline-none focus:border-[#8b5cf6] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-3 top-3 text-text-muted hover:text-text-title transition-colors"
                >
                  {showGroqKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 disabled:opacity-50 text-white transition-opacity cursor-pointer"
          >
            {isSaving ? 'Saving Configurations...' : 'Save Configurations'}
          </button>
        </form>
      </div>

      {/* Danger Zone Panel */}
      <div className="glass-panel p-6 rounded-2xl border-red-500/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-xs text-text-muted">
          Perform database maintenance. This operation cannot be undone. Make sure you have backed up any critical passenger details.
        </p>
        <button
          onClick={handleResetDb}
          disabled={isResetting}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 transition-all disabled:opacity-50"
        >
          {isResetting ? 'Resetting Database...' : 'Wipe Local Database'}
        </button>
      </div>
    </div>
  );
}
