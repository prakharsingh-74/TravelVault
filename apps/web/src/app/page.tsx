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
    errorMsg = 'Database connection error. Let\'s sync the database in Settings!';
  }

  // Calculate passenger and document distributions for the visual chart
  const passCount = allPassengers.length;
  const docCount = allDocs.length;
  const totalCount = passCount + docCount;
  const passPercent = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 50;
  const docPercent = totalCount > 0 ? Math.round((docCount / totalCount) * 100) : 50;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in relative z-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-[#e4e4e7] to-[#a1a1aa] bg-clip-text text-transparent">
            TravelVault Dashboard
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Local-first AI credential manager and autocomplete utility for modern travelers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1.5 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          Secure Local Engine
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-3">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-3 top-3 w-16 h-16 bg-[#8b5cf6]/5 rounded-full blur-xl group-hover:bg-[#8b5cf6]/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Passengers</span>
            <span className="p-1 rounded-md bg-[#8b5cf6]/10 text-[#8b5cf6]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">{passCount}</span>
            <Link href="/passengers" className="text-[11px] text-[#8b5cf6] hover:underline font-semibold flex items-center gap-0.5">
              Profiles <span className="text-xs">→</span>
            </Link>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-3 top-3 w-16 h-16 bg-[#3b82f6]/5 rounded-full blur-xl group-hover:bg-[#3b82f6]/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Documents</span>
            <span className="p-1 rounded-md bg-[#3b82f6]/10 text-[#3b82f6]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">{docCount}</span>
            <Link href="/documents" className="text-[11px] text-[#3b82f6] hover:underline font-semibold flex items-center gap-0.5">
              Scanner <span className="text-xs">→</span>
            </Link>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group bg-gradient-to-br from-indigo-500/[0.04] to-violet-500/[0.01]">
          <div className="absolute right-3 top-3 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Vector Memory</span>
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Local AI Engine Ready
            </span>
            <Link href="/search" className="text-[11px] text-[#8b5cf6] hover:underline font-semibold flex items-center gap-0.5">
              Ask AI <span className="text-xs">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Database visual chart and Quick Actions split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database overview chart (2 cols on lg) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#e4e4e7] uppercase tracking-wider mb-1">Local Storage Index</h3>
            <p className="text-[11px] text-[#a1a1aa]">Distribution of local profiles and scanned documents index.</p>
          </div>

          <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Inline SVG Donut Chart */}
            <div className="flex justify-center relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
                {/* Passengers slice (purple) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3.2"
                  strokeDasharray={`${totalCount > 0 ? passPercent : 50} ${100 - (totalCount > 0 ? passPercent : 50)}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Documents slice (blue) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.2"
                  strokeDasharray={`${totalCount > 0 ? docPercent : 50} ${100 - (totalCount > 0 ? docPercent : 50)}`}
                  strokeDashoffset={`-${totalCount > 0 ? passPercent : 50}`}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-none">{totalCount}</span>
                <span className="text-[9px] text-[#71717a] mt-1 uppercase font-semibold">items</span>
              </div>
            </div>

            {/* Labels and legends */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span>
                  <span className="text-xs text-[#a1a1aa]">Passengers</span>
                </div>
                <span className="text-xs font-semibold text-white">{passCount} ({totalCount > 0 ? passPercent : 0}%)</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                  <span className="text-xs text-[#a1a1aa]">Documents</span>
                </div>
                <span className="text-xs font-semibold text-white">{docCount} ({totalCount > 0 ? docPercent : 0}%)</span>
              </div>
              <div className="text-[10px] text-[#71717a] italic">
                * All data is stored strictly locally in your user SQLite DB directory (`/storage`).
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (1 col on lg) */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#e4e4e7] uppercase tracking-wider mb-1">Quick Actions</h3>
            <p className="text-[11px] text-[#a1a1aa]">Instantly manage or query credentials.</p>
          </div>

          <div className="space-y-2">
            <Link
              href="/passengers?new=true"
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <div>
                  <span className="text-xs font-semibold text-white block">Add Passenger</span>
                  <span className="text-[9px] text-[#71717a] block mt-0.5">Register a new profile</span>
                </div>
              </div>
              <span className="text-xs text-[#71717a] group-hover:text-white transition-colors">→</span>
            </Link>

            <Link
              href="/documents"
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span>
                <div>
                  <span className="text-xs font-semibold text-white block">Upload Document</span>
                  <span className="text-[9px] text-[#71717a] block mt-0.5">Run local OCR engine scan</span>
                </div>
              </div>
              <span className="text-xs text-[#71717a] group-hover:text-white transition-colors">→</span>
            </Link>

            <Link
              href="/search"
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <div>
                  <span className="text-xs font-semibold text-white block">AI Assistant Chat</span>
                  <span className="text-[9px] text-[#71717a] block mt-0.5">Natural language query</span>
                </div>
              </div>
              <span className="text-xs text-[#71717a] group-hover:text-white transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Passenger & Documents preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Passengers */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-[#e4e4e7] uppercase tracking-wider">Recent Passengers</h2>
            <Link href="/passengers" className="text-[10px] text-[#a1a1aa] hover:underline font-semibold">View All</Link>
          </div>
          <div className="glass-panel rounded-2xl p-4 divide-y divide-white/[0.04] space-y-3">
            {allPassengers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[11px] text-[#71717a]">No passenger profiles found.</p>
                <Link href="/passengers?new=true" className="text-[10px] text-[#8b5cf6] hover:underline mt-1 inline-block">Create first profile</Link>
              </div>
            ) : (
              allPassengers.slice(0, 4).map((p: any) => {
                const initials = p.name ? p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'P';
                return (
                  <div key={p.id} className="flex justify-between items-center pt-3 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8b5cf6]/10 to-[#3b82f6]/10 border border-[#8b5cf6]/20 flex items-center justify-center font-bold text-xs text-[#8b5cf6]">
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{p.name}</h4>
                        <p className="text-[10px] text-[#a1a1aa]">{p.nationality} • {p.gender}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${p.passport ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {p.passport ? 'Passport Stored' : 'No Passport'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-[#e4e4e7] uppercase tracking-wider">Recent Documents</h2>
            <Link href="/documents" className="text-[10px] text-[#a1a1aa] hover:underline font-semibold">View All</Link>
          </div>
          <div className="glass-panel rounded-2xl p-4 divide-y divide-white/[0.04] space-y-3">
            {allDocs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[11px] text-[#71717a]">No travel documents uploaded.</p>
                <Link href="/documents" className="text-[10px] text-[#3b82f6] hover:underline mt-1 inline-block">Upload passport or ID</Link>
              </div>
            ) : (
              allDocs.slice(0, 4).map((d: any) => {
                const passenger = allPassengers.find((p) => p.id === d.passengerId);
                return (
                  <div key={d.id} className="flex justify-between items-center pt-3 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.04] flex items-center justify-center text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{d.name}</h4>
                        <p className="text-[10px] text-[#a1a1aa]">{d.type} • Owner: {passenger?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                      OCR Indexed
                    </span>
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
