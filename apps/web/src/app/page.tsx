import { db, passengers, documents } from '@travelvault/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let allPassengers: any[] = [];
  let allDocs: any[] = [];
  let errorMsg = '';

  try {
    allPassengers = await db.select().from(passengers);
    allDocs = await db.select().from(documents);
  } catch (e: any) {
    console.error('Failed to load dashboard data:', e);
    errorMsg = 'Database not initialized yet. Add passengers to get started!';
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
          Secure Travel Vault
        </h1>
        <p className="text-sm text-[#a1a1aa]">
          Manage passenger profiles, store travel documents locally, and autofill forms with AI.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36">
          <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Total Passengers</span>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-bold">{allPassengers.length}</span>
            <Link href="/passengers" className="text-xs text-[#8b5cf6] hover:underline font-medium">View all →</Link>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36">
          <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Indexed Documents</span>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-4xl font-bold">{allDocs.length}</span>
            <Link href="/documents" className="text-xs text-[#8b5cf6] hover:underline font-medium">View all →</Link>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36 bg-gradient-to-br from-[#1e154a]/30 to-[#0e1726]/10">
          <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Local Vector Memory</span>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Local AI Engine Ready
            </span>
            <Link href="/search" className="text-xs text-[#8b5cf6] hover:underline font-medium">Ask Assistant →</Link>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-[#e4e4e7]">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/passengers?new=true" className="glass-panel p-5 rounded-xl hover:bg-[#18181b] transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-sm">Add Passenger</h3>
              <p className="text-xs text-[#a1a1aa]">Create passenger profile</p>
            </div>
          </Link>

          <Link href="/documents" className="glass-panel p-5 rounded-xl hover:bg-[#18181b] transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-sm">Upload Document</h3>
              <p className="text-xs text-[#a1a1aa]">Extract details with local OCR</p>
            </div>
          </Link>

          <Link href="/search" className="glass-panel p-5 rounded-xl hover:bg-[#18181b] transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-sm">AI Assistant</h3>
              <p className="text-xs text-[#a1a1aa]">Natural language travel search</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout for Passenger & Documents preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Passengers */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#e4e4e7]">Recent Passengers</h2>
            <Link href="/passengers" className="text-xs text-[#a1a1aa] hover:underline">View All</Link>
          </div>
          <div className="glass-panel rounded-2xl p-4 divide-y divide-[#27272a]/50 space-y-3">
            {allPassengers.length === 0 ? (
              <p className="text-xs text-[#a1a1aa] text-center py-6">No passenger profiles found.</p>
            ) : (
              allPassengers.slice(0, 4).map((p: any) => (
                <div key={p.id} className="flex justify-between items-center pt-3 first:pt-0">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                    <p className="text-xs text-[#a1a1aa]">{p.nationality} • {p.gender}</p>
                  </div>
                  <span className="text-[10px] bg-[#27272a] text-[#d4d4d8] px-2.5 py-1 rounded-full font-mono">
                    {p.passport ? 'Passport Stored' : 'No Passport'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#e4e4e7]">Recent Documents</h2>
            <Link href="/documents" className="text-xs text-[#a1a1aa] hover:underline">View All</Link>
          </div>
          <div className="glass-panel rounded-2xl p-4 divide-y divide-[#27272a]/50 space-y-3">
            {allDocs.length === 0 ? (
              <p className="text-xs text-[#a1a1aa] text-center py-6">No travel documents uploaded.</p>
            ) : (
              allDocs.slice(0, 4).map((d: any) => {
                const passenger = allPassengers.find((p) => p.id === d.passengerId);
                return (
                  <div key={d.id} className="flex justify-between items-center pt-3 first:pt-0">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{d.name}</h4>
                      <p className="text-xs text-[#a1a1aa]">{d.type} • Owner: {passenger?.name || 'Unknown'}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">OCR Indexed</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
