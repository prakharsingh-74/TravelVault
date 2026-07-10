'use client';

import { useState, useEffect } from 'react';

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'docs' | 'preferences'>('personal');
  const [copiedField, setCopiedField] = useState<{ id: string; type: string } | null>(null);
  
  // Form State (using string ID since all database primary keys are UUIDs)
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [nationality, setNationality] = useState('Indian');
  const [aadhaar, setAadhaar] = useState('');
  const [passport, setPassport] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [preferredBerth, setPreferredBerth] = useState('LB');
  const [mealPreference, setMealPreference] = useState('Veg');

  useEffect(() => {
    fetchPassengers();
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('new') === 'true') {
        openNewModal();
      }
    }
  }, []);

  const fetchPassengers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/passengers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPassengers(data);
      }
    } catch (e) {
      console.error('Failed to load passengers', e);
    } finally {
      setIsLoading(false);
    }
  };

  const openNewModal = () => {
    setCurrentId(null);
    setName('');
    setDob('');
    setGender('Male');
    setNationality('Indian');
    setAadhaar('');
    setPassport('');
    setMobile('');
    setEmail('');
    setPreferredBerth('LB');
    setMealPreference('Veg');
    setActiveFormTab('personal');
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setCurrentId(p.id);
    setName(p.name);
    const formattedDate = p.dob ? new Date(p.dob).toISOString().split('T')[0] : '';
    setDob(formattedDate);
    setGender(p.gender || 'Male');
    setNationality(p.nationality || 'Indian');
    setAadhaar(p.aadhaar || '');
    setPassport(p.passport || '');
    setMobile(p.mobile || '');
    setEmail(p.email || '');
    setPreferredBerth(p.preferredBerth || 'LB');
    setMealPreference(p.mealPreference || 'Veg');
    setActiveFormTab('personal');
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string, id: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField({ id, type });
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/passengers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentId,
          name,
          dob,
          gender,
          nationality,
          aadhaar: aadhaar || null,
          passport: passport || null,
          mobile: mobile || null,
          email: email || null,
          preferredBerth,
          mealPreference,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPassengers();
      } else {
        const err = await res.json();
        alert(`Error saving passenger: ${err.error}`);
      }
    } catch (error) {
      alert('Network error saving passenger profile.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passenger profile?')) return;
    try {
      const res = await fetch(`/api/passengers/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPassengers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPassengers = passengers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.passport && p.passport.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in relative z-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
            Passenger Profiles
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Store and manage secure traveler data on your system for high-speed autocomplete.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 transition-all shadow-lg shadow-purple-500/15 text-white flex items-center gap-2 cursor-pointer self-start"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Passenger
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-xl p-2.5 flex items-center gap-3 border border-white/[0.04] bg-white/[0.01]">
        <svg className="w-4 h-4 text-[#a1a1aa] ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search passengers by name or passport..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-white placeholder-zinc-500 outline-none text-xs w-full"
        />
      </div>

      {/* Grid of passengers */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-500 text-xs">Loading traveler database...</div>
      ) : filteredPassengers.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center text-zinc-500 text-xs border border-white/[0.04]">
          No passengers found. Click "Add Passenger" to create your first profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPassengers.map((p) => (
            <div key={p.id} className="boarding-pass-card p-6 flex flex-col justify-between group">
              <div>
                {/* Header of Pass */}
                <div className="flex justify-between items-start border-b border-white/[0.05] pb-4 mb-4">
                  <div>
                    <span className="text-[9px] text-[#8b5cf6] font-extrabold uppercase tracking-widest">BOARDING ID PASS</span>
                    <h3 className="text-base font-bold text-white mt-0.5 tracking-tight group-hover:text-[#8b5cf6] transition-colors">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-400">{p.nationality}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                      <span className="text-[10px] text-zinc-400">{p.gender}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                      title="Edit Profile"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete Profile"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Grid data */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-[11px] pb-4">
                  <div>
                    <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase font-bold tracking-wider">Date of Birth</span>
                    <span className="font-semibold text-[#e4e4e7]">{p.dob ? new Date(p.dob).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase font-bold tracking-wider">Mobile Phone</span>
                    <span className="font-semibold text-[#e4e4e7]">{p.mobile || 'N/A'}</span>
                  </div>

                  {/* Copyable Credentials */}
                  <div className="relative">
                    <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase font-bold tracking-wider">Aadhaar Card</span>
                    <button
                      onClick={() => copyToClipboard(p.aadhaar, p.id, 'aadhaar')}
                      disabled={!p.aadhaar}
                      className="font-mono text-zinc-300 font-medium hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-left w-full"
                    >
                      {p.aadhaar ? (
                        <>
                          <span>{p.aadhaar}</span>
                          <span className="text-[9px] text-[#8b5cf6]">
                            {copiedField?.id === p.id && copiedField?.type === 'aadhaar' ? '✓ Copied' : '📋'}
                          </span>
                        </>
                      ) : (
                        <span className="text-zinc-600">Not Provided</span>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase font-bold tracking-wider">Passport</span>
                    <button
                      onClick={() => copyToClipboard(p.passport, p.id, 'passport')}
                      disabled={!p.passport}
                      className="font-mono text-zinc-300 font-medium hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-left w-full"
                    >
                      {p.passport ? (
                        <>
                          <span>{p.passport}</span>
                          <span className="text-[9px] text-[#8b5cf6]">
                            {copiedField?.id === p.id && copiedField?.type === 'passport' ? '✓ Copied' : '📋'}
                          </span>
                        </>
                      ) : (
                        <span className="text-zinc-600">Not Provided</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Section resembling ticket details */}
                <div className="border-t border-dashed border-white/[0.08] pt-4 mt-2 flex items-center justify-between">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-zinc-600 block text-[8px] uppercase font-bold tracking-wider">Berth Pref</span>
                      <span className="text-white font-bold font-mono text-[10px]">
                        {p.preferredBerth === 'LB' && 'LOWER (LB)'}
                        {p.preferredBerth === 'MB' && 'MIDDLE (MB)'}
                        {p.preferredBerth === 'UB' && 'UPPER (UB)'}
                        {p.preferredBerth === 'SL' && 'SIDE LOWER (SL)'}
                        {p.preferredBerth === 'SU' && 'SIDE UPPER (SU)'}
                        {!['LB', 'MB', 'UB', 'SL', 'SU'].includes(p.preferredBerth) && (p.preferredBerth || 'NONE')}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block text-[8px] uppercase font-bold tracking-wider">Meal Pref</span>
                      <span className="text-white font-bold font-mono text-[10px] uppercase">
                        {p.mealPreference || 'NONE'}
                      </span>
                    </div>
                  </div>

                  {/* Micro chip & flight SVG */}
                  <div className="flex items-center gap-3">
                    <div className="sim-chip"></div>
                    <svg className="w-5 h-5 text-zinc-700 transform rotate-45" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L6 12zm0 0h7.5" />
                    </svg>
                  </div>
                </div>

                {/* Mock Barcode */}
                <div className="flex gap-0.5 h-5 opacity-20 mt-4 overflow-hidden rounded">
                  <div className="w-1 bg-white h-full"></div>
                  <div className="w-2 bg-white h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-1.5 bg-white h-full"></div>
                  <div className="w-1 bg-white h-full"></div>
                  <div className="w-3 bg-white h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-2 bg-white h-full"></div>
                  <div className="w-1.5 bg-white h-full"></div>
                  <div className="w-1 bg-white h-full"></div>
                  <div className="w-2 bg-white h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-3 bg-white h-full"></div>
                  <div className="w-1 bg-white h-full"></div>
                  <div className="w-1.5 bg-white h-full"></div>
                  <div className="w-1 bg-white h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-2.5 bg-white h-full"></div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/[0.08]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-[#09090b]">
              <div>
                <h2 className="text-base font-bold text-white">{currentId ? 'Edit Passenger Details' : 'Register New Passenger'}</h2>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Fill passenger parameters for vector mapping</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sub-Header Tabs */}
            <div className="flex border-b border-white/[0.04] bg-[#0c0c10] px-5 py-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveFormTab('personal')}
                className={`px-3 py-2 text-[11px] font-semibold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'personal'
                    ? 'text-white border-[#8b5cf6]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                1. Identity & Contact
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('docs')}
                className={`px-3 py-2 text-[11px] font-semibold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'docs'
                    ? 'text-white border-[#8b5cf6]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                2. Credentials & IDs
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('preferences')}
                className={`px-3 py-2 text-[11px] font-semibold transition-all border-b-2 cursor-pointer ${
                  activeFormTab === 'preferences'
                    ? 'text-white border-[#8b5cf6]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                3. Preferences
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#09090b]">
              
              {/* Tab 1: Personal info */}
              {activeFormTab === 'personal' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] placeholder-zinc-600 font-medium"
                        placeholder="E.g. Prakhar Singh"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Gender *</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-medium"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Nationality *</label>
                      <input
                        type="text"
                        required
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] placeholder-zinc-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Mobile Phone</label>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] placeholder-zinc-600 font-medium"
                        placeholder="Mobile number"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] placeholder-zinc-600 font-medium"
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('docs')}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      Next: Credentials →
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Document Credentials */}
              {activeFormTab === 'docs' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Aadhaar Card Number</label>
                      <input
                        type="text"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-mono placeholder-zinc-600"
                        placeholder="12-digit Aadhaar number"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Passport Number</label>
                      <input
                        type="text"
                        value={passport}
                        onChange={(e) => setPassport(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-mono placeholder-zinc-600"
                        placeholder="Passport number"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('personal')}
                      className="px-4 py-2 border border-white/[0.05] hover:bg-white/[0.02] text-zinc-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('preferences')}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      Next: Preferences →
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Travel preferences */}
              {activeFormTab === 'preferences' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Preferred Berth/Seat</label>
                      <select
                        value={preferredBerth}
                        onChange={(e) => setPreferredBerth(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-medium"
                      >
                        <option value="LB">Lower Berth (LB)</option>
                        <option value="MB">Middle Berth (MB)</option>
                        <option value="UB">Upper Berth (UB)</option>
                        <option value="SL">Side Lower (SL)</option>
                        <option value="SU">Side Upper (SU)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Meal Preference</label>
                      <select
                        value={mealPreference}
                        onChange={(e) => setMealPreference(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-medium"
                      >
                        <option value="Veg">Vegetarian (Veg)</option>
                        <option value="Non-Veg">Non-Vegetarian</option>
                        <option value="No Preference">No Preference</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('docs')}
                      className="px-4 py-2 border border-white/[0.05] hover:bg-white/[0.02] text-zinc-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 text-white transition-opacity cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
