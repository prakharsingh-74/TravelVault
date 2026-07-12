'use client';

import { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

interface ExpenseItem {
  id: string;
  name: string;
  filePath: string;
  createdAt: string;
  passengerId: string;
  passengerName: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: 'Food' | 'Transport' | 'Hotel' | 'Other';
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Scan & Form State
  const [passengerId, setPassengerId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchExpenses();
    fetchPassengers();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/documents');
      const docs = await res.json();
      const passRes = await fetch('/api/passengers');
      const passData = await passRes.json();

      if (Array.isArray(docs)) {
        // Filter documents that are Receipts
        const receiptDocs = docs.filter((d: any) => d.type === 'Receipt');
        
        const mapped = receiptDocs.map((d: any) => {
          const owner = passData.find((p: any) => p.id === d.passengerId);
          let parsed = {
            merchant: d.name,
            amount: 0,
            currency: 'INR',
            date: new Date(d.createdAt).toISOString().split('T')[0],
            category: 'Other' as const
          };

          try {
            if (d.ocrText && d.ocrText.trim().startsWith('{')) {
              parsed = JSON.parse(d.ocrText);
            }
          } catch (e) {
            console.error('Failed parsing receipt details:', e);
          }

          return {
            id: d.id,
            name: d.name,
            filePath: d.filePath,
            createdAt: d.createdAt,
            passengerId: d.passengerId,
            passengerName: owner ? owner.name : 'Unknown Passenger',
            merchant: parsed.merchant || d.name,
            amount: Number(parsed.amount) || 0,
            currency: parsed.currency || 'INR',
            date: parsed.date || new Date(d.createdAt).toISOString().split('T')[0],
            category: (parsed.category || 'Other') as any
          };
        });

        // Sort by date descending
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setExpenses(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPassengers = async () => {
    try {
      const res = await fetch('/api/passengers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPassengers(data);
        if (data.length > 0) {
          setPassengerId(data[0].id.toString());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setImagePreview('pdf');
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      handleFile(file);
    }
  };

  const runOcr = async () => {
    if (!selectedFile || imagePreview === 'pdf') return;
    setIsOcrRunning(true);
    setOcrStatus('Scanning receipt layout...');
    setOcrProgress(20);
    
    try {
      const worker = await createWorker('eng');
      setOcrStatus('Extracting receipt values...');
      setOcrProgress(50);
      
      const { data: { text } } = await worker.recognize(selectedFile);
      setOcrText(text);
      setOcrStatus('Scan complete.');
      setOcrProgress(100);
      await worker.terminate();
    } catch (error: any) {
      console.error('Scan failed', error);
      setOcrStatus(`Scan failed: ${error.message || error}`);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerId) {
      alert('Please link a passenger profile.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', selectedFile ? selectedFile.name.split('.')[0] : 'Expense Receipt');
      formData.append('type', 'Receipt');
      formData.append('passengerId', passengerId);
      formData.append('ocrText', ocrText);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedFile(null);
        setImagePreview(null);
        setOcrText('');
        setOcrProgress(0);
        setOcrStatus('');
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(`Error saving expense receipt: ${err.error}`);
      }
    } catch (error) {
      alert('Failed saving receipt.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this receipt?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compute stats
  const totalSpend = expenses.reduce((acc, cur) => acc + cur.amount, 0);
  
  const categorySummary = expenses.reduce(
    (acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + cur.amount;
      return acc;
    },
    { Food: 0, Transport: 0, Hotel: 0, Other: 0 }
  );

  const highestCategory = Object.entries(categorySummary).reduce(
    (max, [cat, val]) => (val > max.val ? { cat, val } : max),
    { cat: 'None', val: 0 }
  );

  const maxVal = Math.max(...Object.values(categorySummary), 1);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-text-title to-text-muted bg-clip-text text-transparent">
            Travel Expense Tracker
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Upload cab receipts, hotel invoices, or food bills. The AI scans and charts categorized expenses automatically.
          </p>
        </div>
        <button
          onClick={() => {
            if (passengers.length === 0) {
              alert('Please register a passenger first.');
              return;
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 transition-all shadow-lg shadow-purple-500/15 text-white flex items-center gap-2 cursor-pointer self-start"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Scan Receipt
        </button>
      </div>

      {/* Metrics & Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-border-main flex flex-col justify-between">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Travel Spend</span>
          <span className="text-2xl font-extrabold text-text-title mt-2">
            ₹{totalSpend.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-text-muted mt-2">Parsed from {expenses.length} receipts</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border-main flex flex-col justify-between">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Highest Expense Area</span>
          <span className="text-2xl font-extrabold text-[#8b5cf6] mt-2">
            {highestCategory.cat}
          </span>
          <span className="text-[10px] text-text-muted mt-2">
            ₹{highestCategory.val.toLocaleString('en-IN')} spent
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border-main flex flex-col justify-between">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Active Receipts</span>
          <span className="text-2xl font-extrabold text-text-title mt-2">
            {expenses.length}
          </span>
          <span className="text-[10px] text-text-muted mt-2">Stored securely in TravelVault</span>
        </div>
      </div>

      {/* Expense Charts & Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border-main lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-text-title">Spending by Category</h2>
          
          <div className="space-y-4 pt-2">
            {Object.entries(categorySummary).map(([category, amount]) => {
              const pct = (amount / maxVal) * 100;
              const barColor = 
                category === 'Food' ? 'from-amber-400 to-orange-500' :
                category === 'Transport' ? 'from-blue-400 to-indigo-500' :
                category === 'Hotel' ? 'from-emerald-400 to-teal-500' :
                'from-purple-400 to-pink-500';

              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-title">{category}</span>
                    <span className="text-text-muted">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-input-bg h-2 rounded-full overflow-hidden border border-input-border">
                    <div 
                      className={`h-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                      style={{ width: `${amount > 0 ? Math.max(pct, 4) : 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual SVG Donut chart representation */}
        <div className="glass-panel p-6 rounded-2xl border border-border-main flex flex-col justify-between items-center text-center">
          <h2 className="text-sm font-bold text-text-title w-full text-left mb-4">Spend Breakdown</h2>
          
          {totalSpend > 0 ? (
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background track */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border-main)" strokeWidth="3" />
                
                {/* Dynamic slices */}
                {(() => {
                  let accumPct = 0;
                  return Object.entries(categorySummary).map(([cat, val]) => {
                    const pct = (val / totalSpend) * 100;
                    if (pct === 0) return null;
                    const strokeDash = `${pct} ${100 - pct}`;
                    const strokeOffset = 100 - accumPct;
                    accumPct += pct;

                    const color = 
                      cat === 'Food' ? '#f59e0b' :
                      cat === 'Transport' ? '#3b82f6' :
                      cat === 'Hotel' ? '#10b981' :
                      '#a855f7';

                    return (
                      <circle
                        key={cat}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={color}
                        strokeWidth="3.2"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute flex flex-col justify-center items-center">
                <span className="text-[9px] text-text-muted font-bold uppercase">Total</span>
                <span className="text-xs font-extrabold text-text-title">₹{totalSpend.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <div className="w-36 h-36 rounded-full border border-dashed border-border-main flex items-center justify-center text-text-muted text-xs">
              No Data
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4 text-[10px] font-semibold text-text-muted">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#f59e0b]"></span>Food</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#3b82f6]"></span>Transport</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#10b981]"></span>Hotel</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#a855f7]"></span>Other</div>
          </div>
        </div>
      </div>

      {/* Receipts Table List */}
      <div className="glass-panel rounded-2xl border border-border-main overflow-hidden">
        <div className="p-5 border-b border-border-main">
          <h2 className="text-sm font-bold text-text-title">Scanned Receipts Gallery</h2>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs">
            No receipts scanned yet. Use the "Scan Receipt" button to populate expenses.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/[0.02] light:bg-black/[0.01] border-b border-border-main text-text-muted font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-4">Date</th>
                  <th className="p-4">Merchant / Bill</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const badgeColor = 
                    exp.category === 'Food' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                    exp.category === 'Transport' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                    exp.category === 'Hotel' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    'text-purple-400 bg-purple-500/10 border-purple-500/20';

                  return (
                    <tr key={exp.id} className="border-b border-border-main hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 text-text-muted font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-text-title">{exp.merchant}</td>
                      <td className="p-4 text-text-muted font-semibold">{exp.passengerName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] border ${badgeColor} font-bold`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-extrabold text-text-title text-sm">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          {exp.filePath && (
                            <a
                              href={exp.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#3b82f6] hover:underline font-bold"
                            >
                              View Bill
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload/Scan Receipt Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-border-main">
            <div className="p-5 border-b border-border-main flex justify-between items-center bg-sidebar-bg">
              <div>
                <h2 className="text-base font-bold text-text-title">Scan New Travel Receipt</h2>
                <span className="text-[10px] text-text-muted block mt-0.5">Upload a bill to auto-extract date, merchant, and price details</span>
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

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 bg-sidebar-bg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted block mb-1.5 uppercase tracking-wider">Link Passenger *</label>
                    <select
                      value={passengerId}
                      onChange={(e) => setPassengerId(e.target.value)}
                      className="w-full bg-input-bg border border-input-border rounded-lg p-2.5 text-xs text-text-title focus:outline-none focus:border-[#8b5cf6] font-medium"
                    >
                      {passengers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-muted block mb-2 uppercase tracking-wider">Drop Travel Receipt</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/5'
                          : 'border-input-border hover:border-[#8b5cf6] bg-input-bg'
                      }`}
                    >
                      <svg className="w-8 h-8 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-text-muted block font-semibold">
                        {selectedFile ? selectedFile.name : 'Select bill file'}
                      </span>
                      <span className="text-[9px] text-text-muted mt-1 block">Supports PDF, PNG, JPG, JPEG</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Scan preview area */}
                <div className="space-y-4">
                  <div className="relative border border-input-border rounded-xl overflow-hidden bg-input-bg h-44 flex items-center justify-center ocr-scanner-overlay">
                    {imagePreview === 'pdf' ? (
                      <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                        <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="text-xs text-text-title font-semibold max-w-[180px] truncate">{selectedFile?.name}</span>
                        <span className="text-[9px] text-text-muted">PDF Invoice</span>
                      </div>
                    ) : imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                        {isOcrRunning && <div className="ocr-scanner-line"></div>}
                      </>
                    ) : (
                      <span className="text-xs text-text-muted">No Receipt Selected</span>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="space-y-3">
                      {imagePreview === 'pdf' ? (
                        <div className="bg-input-bg border border-input-border p-3 rounded-lg text-center">
                          <span className="text-xs font-semibold text-text-title block">Native Receipt Parser</span>
                          <span className="text-[9px] text-text-muted block mt-1">PDF detected. The server AI will extract transaction details on save.</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={runOcr}
                          disabled={isOcrRunning}
                          className="w-full py-2.5 rounded-lg text-xs font-semibold bg-input-bg border border-border-main hover:border-text-muted disabled:opacity-50 text-text-title transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isOcrRunning ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-text-title border-t-transparent rounded-full animate-spin"></span>
                              Scanning...
                            </>
                          ) : (
                            'Scan Image Text (OCR)'
                          )}
                        </button>
                      )}

                      {ocrStatus && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-text-muted block font-bold uppercase tracking-wider">{ocrStatus}</span>
                          <div className="w-full bg-border-main h-1 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-border-main pt-4 bg-sidebar-bg -mx-6 -mb-6 p-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-input-bg border border-border-main text-text-title hover:border-text-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 text-white transition-opacity cursor-pointer"
                >
                  Upload & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
