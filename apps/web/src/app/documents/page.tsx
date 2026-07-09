'use client';

import { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocName(file.name.split('.')[0]);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runOcr = async () => {
    if (!selectedFile) return;
    setIsOcrRunning(true);
    setOcrStatus('Initializing OCR engine...');
    setOcrProgress(10);
    
    try {
      // In Tesseract v5 we create the worker
      const worker = await createWorker('eng');
      
      setOcrStatus('Running OCR text extraction...');
      setOcrProgress(50);
      
      const { data: { text } } = await worker.recognize(selectedFile);
      
      setOcrText(text);
      setOcrStatus('OCR extraction complete.');
      setOcrProgress(100);
      await worker.terminate();
    } catch (error: any) {
      console.error('OCR failed', error);
      setOcrStatus(`OCR failed: ${error.message || error}`);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerId) {
      alert('Please select a passenger to link the document to.');
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
        // Reset state
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

  const handleDelete = async (id: number) => {
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
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
            Travel Documents
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            Store passports, visas, and IDs. Scan with local OCR for passenger autofill.
          </p>
        </div>
        <button
          onClick={() => {
            if (passengers.length === 0) {
              alert('Please add a passenger profile first.');
              return;
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:opacity-90 transition-all shadow-md text-white"
        >
          Upload Document
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-[#a1a1aa] text-sm">Loading travel documents...</div>
      ) : documents.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center text-[#a1a1aa] text-sm">
          No travel documents found. Upload one to extract details with local OCR.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((d) => {
            const owner = passengers.find((p) => p.id === d.passengerId);
            return (
              <div key={d.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white group-hover:text-[#8b5cf6] transition-colors">{d.name}</h3>
                      <span className="text-xs text-[#a1a1aa]">{d.type}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 rounded-lg bg-[#27272a]/50 text-[#a1a1aa] hover:text-red-400 hover:bg-[#27272a] transition-all"
                      title="Delete Document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs border-t border-[#27272a]/50 pt-4">
                    <div>
                      <span className="text-[#71717a] block mb-0.5">Linked Passenger</span>
                      <span className="font-medium text-[#e4e4e7]">{owner ? owner.name : 'Unknown'}</span>
                    </div>
                    {d.ocrText && (
                      <div>
                        <span className="text-[#71717a] block mb-0.5">Extracted Details</span>
                        <div className="bg-[#18181b] p-3 rounded-lg border border-[#27272a] font-mono text-[10px] text-[#a1a1aa] max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {d.ocrText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-[10px] text-[#71717a] flex justify-between items-center">
                  <span>Uploaded {new Date(d.createdAt).toLocaleDateString()}</span>
                  <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">Indexed</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#27272a] flex justify-between items-center bg-[#0c0c0e]">
              <h2 className="text-xl font-bold text-white">Upload Travel Document</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Document Name *</label>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                      placeholder="E.g. Passport - Prakhar"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Document Type *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                    >
                      <option value="Passport">Passport</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Visa">Visa</option>
                      <option value="Other ID">Other ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#a1a1aa] block mb-1">Link to Passenger *</label>
                    <select
                      value={passengerId}
                      onChange={(e) => setPassengerId(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
                    >
                      {passengers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#a1a1aa] block mb-1.5">File Upload</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#27272a] hover:border-[#8b5cf6] rounded-xl p-6 text-center cursor-pointer transition-all bg-[#18181b]"
                    >
                      <svg className="w-8 h-8 text-[#a1a1aa] mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-[#a1a1aa] block font-medium">Click or drag files here to upload</span>
                      <span className="text-[10px] text-[#71717a] mt-1 block">Supports PNG, JPG, JPEG</span>
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
                  {imagePreview ? (
                    <div className="relative border border-[#27272a] rounded-xl overflow-hidden bg-[#18181b] h-48 flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="border border-[#27272a] rounded-xl bg-[#121214] h-48 flex items-center justify-center text-xs text-[#71717a]">
                      No document selected
                    </div>
                  )}

                  {selectedFile && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={runOcr}
                        disabled={isOcrRunning}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-50 text-white transition-colors"
                      >
                        {isOcrRunning ? 'Running OCR...' : 'Run Local OCR Scan'}
                      </button>

                      {ocrStatus && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-[#a1a1aa] block font-semibold">{ocrStatus}</span>
                          <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#8b5cf6] h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {ocrText && (
                        <div>
                          <label className="text-[10px] font-semibold text-[#a1a1aa] block mb-1">OCR Output (Refine text if needed)</label>
                          <textarea
                            value={ocrText}
                            onChange={(e) => setOcrText(e.target.value)}
                            rows={4}
                            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                      )}
                    </div>
                  )}
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
