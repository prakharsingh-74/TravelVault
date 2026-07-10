'use client';

import { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // OCR and Form State
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Passport');
  const [passengerId, setPassengerId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchPassengers();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
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
    setDocName(file.name.split('.')[0]);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const runOcr = async () => {
    if (!selectedFile) return;
    setIsOcrRunning(true);
    setOcrStatus('Initializing OCR Engine...');
    setOcrProgress(15);
    
    try {
      const worker = await createWorker('eng');
      
      setOcrStatus('Reading document layout...');
      setOcrProgress(45);
      
      const { data: { text } } = await worker.recognize(selectedFile);
      
      setOcrText(text);
      setOcrStatus('Extraction complete.');
      setOcrProgress(100);
      await worker.terminate();
    } catch (error: any) {
      console.error('OCR failed', error);
      setOcrStatus(`Scan failed: ${error.message || error}`);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerId) {
      alert('Please select a passenger profile to link.');
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName,
          type: docType,
          passengerId,
          filePath: selectedFile ? selectedFile.name : '',
          ocrText,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedFile(null);
        setImagePreview(null);
        setOcrText('');
        setOcrProgress(0);
        setOcrStatus('');
        fetchDocuments();
      } else {
        const err = await res.json();
        alert(`Error saving document: ${err.error}`);
      }
    } catch (error) {
      alert('Network error saving travel document.');
    }
  };

  // Change parameter type to string since all IDs are string UUIDs in SQLite schema
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
            Travel Documents
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Store passports and Visas. Use browser-side OCR scanning to index details securely.
          </p>
        </div>
        <button
          onClick={() => {
            if (passengers.length === 0) {
              alert('Please register a passenger profile first.');
              return;
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 transition-all shadow-lg shadow-purple-500/15 text-white flex items-center gap-2 cursor-pointer self-start"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Grid of Documents */}
      {isLoading ? (
        <div className="text-center py-20 text-zinc-500 text-xs">Loading document store...</div>
      ) : documents.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center text-zinc-500 text-xs border border-white/[0.04]">
          No documents scanned. Upload passport images or files to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((d) => {
            const owner = passengers.find((p) => p.id === d.passengerId);
            return (
              <div key={d.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all group border border-white/[0.04]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-lg bg-zinc-900 border border-white/[0.04] text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <div>
                        <h3 className="font-bold text-xs text-white group-hover:text-[#8b5cf6] transition-colors">{d.name}</h3>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{d.type}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete Document"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3 text-[11px] border-t border-white/[0.04] pt-4">
                    <div>
                      <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase font-bold tracking-wider">Linked Passenger</span>
                      <span className="font-semibold text-[#e4e4e7]">{owner ? owner.name : 'Unknown Passenger'}</span>
                    </div>
                    {d.ocrText && (
                      <div>
                        <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase font-bold tracking-wider">Extracted OCR Text</span>
                        <div className="bg-[#121216] p-3 rounded-lg border border-white/[0.05] font-mono text-[9px] text-zinc-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {d.ocrText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.04] text-[9px] text-zinc-500 flex justify-between items-center">
                  <span>Scanned {new Date(d.createdAt).toLocaleDateString()}</span>
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">Indexed</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/[0.08]">
            <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-[#09090b]">
              <div>
                <h2 className="text-base font-bold text-white">Index New Travel Document</h2>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Link a passport/ID image and run local browser Tesseract OCR</span>
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

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#09090b]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Document Name *</label>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] placeholder-zinc-600 font-medium"
                      placeholder="E.g. Passport - Prakhar"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Doc Type *</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-medium"
                      >
                        <option value="Passport">Passport</option>
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Visa">Visa</option>
                        <option value="Other ID">Other ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Link Passenger *</label>
                      <select
                        value={passengerId}
                        onChange={(e) => setPassengerId(e.target.value)}
                        className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6] font-medium"
                      >
                        {passengers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase tracking-wider">Upload / Scan Target</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/5'
                          : 'border-white/[0.06] hover:border-[#8b5cf6] bg-[#121216]'
                      }`}
                    >
                      <svg className="w-8 h-8 text-zinc-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-zinc-400 block font-semibold">
                        {selectedFile ? selectedFile.name : 'Select or drag document image'}
                      </span>
                      <span className="text-[9px] text-zinc-600 mt-1 block">Supports PNG, JPG, JPEG</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview / OCR details */}
                <div className="space-y-4">
                  {/* OCR Scanner Overlay Wrapper */}
                  <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-[#121216] h-48 flex items-center justify-center ocr-scanner-overlay">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                        {isOcrRunning && <div className="ocr-scanner-line"></div>}
                      </>
                    ) : (
                      <span className="text-xs text-zinc-600">No Document Selected</span>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={runOcr}
                        disabled={isOcrRunning}
                        className="w-full py-2.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isOcrRunning ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Extracting details...
                          </>
                        ) : (
                          'Run Local OCR Text Scan'
                        )}
                      </button>

                      {ocrStatus && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">{ocrStatus}</span>
                          <div className="w-full bg-[#1e1e24] h-1 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {ocrText && (
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">Refine OCR Text</label>
                          <textarea
                            value={ocrText}
                            onChange={(e) => setOcrText(e.target.value)}
                            rows={3}
                            className="w-full bg-[#121216] border border-white/[0.06] rounded-lg p-2 text-[10px] font-mono text-[#e4e4e7] focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4 bg-[#0c0c10]/50 -mx-6 -mb-6 p-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 text-white transition-opacity cursor-pointer"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
