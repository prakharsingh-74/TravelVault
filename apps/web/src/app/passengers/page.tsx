'use client';

import { useState, useEffect } from 'react';

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [currentId, setCurrentId] = useState<number | null>(null);
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
    
    // Check if query param specifies opening the modal
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
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setCurrentId(p.id);
    setName(p.name);
    // Format date string for HTML date input
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
    setIsModalOpen(true);
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
          aadhaar,
          passport,
          mobile,
          email,
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

  const handleDelete = async (id: number) => {
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
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
            Passengers
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            Store and manage traveler details securely on your system.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 transition-all shadow-md text-white"
        >
          Add Passenger
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-xl p-2.5 flex items-center gap-3">
        <svg className="w-5 h-5 text-[#a1a1aa] ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or passport..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-white placeholder-[#71717a] outline-none text-sm w-full"
        />
      </div>

      {/* Grid of passengers */}
      {isLoading ? (
        <div className="text-center py-20 text-[#a1a1aa] text-sm">Loading passenger profiles...</div>
      ) : filteredPassengers.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center text-[#a1a1aa] text-sm">
          No passenger profiles found. Click "Add Passenger" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPassengers.map((p) => (
            <div key={p.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#8b5cf6] transition-colors">{p.name}</h3>
                    <span className="text-xs text-[#a1a1aa]">{p.nationality} • {p.gender}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-lg bg-[#27272a]/50 text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all"
                      title="Edit Profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg bg-[#27272a]/50 text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete Profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-6 border-t border-[#27272a]/50 pt-4 text-xs">
                  <div>
                    <span className="text-[#71717a] block mb-0.5">Date of Birth</span>
                    <span className="font-medium text-[#e4e4e7]">{p.dob ? new Date(p.dob).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block mb-0.5">Aadhaar Card</span>
                    <span className="font-mono font-medium text-[#e4e4e7]">{p.aadhaar || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block mb-0.5">Passport Number</span>
                    <span className="font-mono font-medium text-[#e4e4e7]">{p.passport || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block mb-0.5">Mobile Phone</span>
                    <span className="font-medium text-[#e4e4e7]">{p.mobile || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block mb-0.5">Seat Preference</span>
                    <span className="font-medium text-[#e4e4e7]">
                      {p.preferredBerth === 'LB' && 'Lower Berth (LB)'}
                      {p.preferredBerth === 'MB' && 'Middle Berth (MB)'}
                      {p.preferredBerth === 'UB' && 'Upper Berth (UB)'}
                      {p.preferredBerth === 'SL' && 'Side Lower (SL)'}
                      {p.preferredBerth === 'SU' && 'Side Upper (SU)'}
                      {!['LB', 'MB', 'UB', 'SL', 'SU'].includes(p.preferredBerth) && (p.preferredBerth || 'No Preference')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block mb-0.5">Food/Meal</span>
                    <span className="font-medium text-[#e4e4e7]">{p.mealPreference || 'No Preference'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#27272a] flex justify-between items-center bg-[#0c0c0e]">
              <h2 className="text-xl font-bold text-white">{currentId ? 'Edit Passenger Profile' : 'New Passenger Profile'}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#a1a1aa] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="E.g. Prakhar Singh"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Nationality *</label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="E.g. Indian"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Aadhaar Card Number</label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6] font-mono"
                    placeholder="12-digit Aadhaar number"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6] font-mono"
                    placeholder="Passport number"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Mobile number"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Preferred Berth/Seat</label>
                  <select
                    value={preferredBerth}
                    onChange={(e) => setPreferredBerth(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                  >
                    <option value="LB">Lower Berth (LB)</option>
                    <option value="MB">Middle Berth (MB)</option>
                    <option value="UB">Upper Berth (UB)</option>
                    <option value="SL">Side Lower (SL)</option>
                    <option value="SU">Side Upper (SU)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Meal Preference</label>
                  <select
                    value={mealPreference}
                    onChange={(e) => setMealPreference(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                  >
                    <option value="Veg">Vegetarian (Veg)</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                    <option value="No Preference">No Preference</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#27272a] pt-4 bg-[#0c0c0e]/50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#27272a] hover:bg-[#3f3f46] text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 text-white transition-opacity"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
