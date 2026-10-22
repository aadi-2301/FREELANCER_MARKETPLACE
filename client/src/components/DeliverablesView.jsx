import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Download,
  AlertTriangle,
  FileCode,
  Lock,
  Binary,
  CheckCircle2,
  Info
} from 'lucide-react';

export const DeliverablesView = ({ preselectedOrderId }) => {
  const { user, authFetch, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [orderDetails, setOrderDetails] = useState(null);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await authFetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (!selectedOrderId && data.orders.length > 0) {
          setSelectedOrderId(data.orders[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrderDetails = async (id) => {
    if (!id) return;
    try {
      const res = await authFetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrderDetails(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedOrderId) return;

    setUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('order_id', selectedOrderId);
    formData.append('notes', notes || 'Security deliverable package');
    formData.append('file', file);

    try {
      const res = await fetch('/api/deliverables/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: data.scanStatus === 'clean' ? 'success' : 'warn',
          text: data.message,
          hash: data.sha256Hash,
          status: data.scanStatus
        });
        setFile(null);
        setNotes('');
        await fetchOrderDetails(selectedOrderId);
      } else {
        setFeedback({ type: 'error', text: data.message || 'File upload failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Error uploading deliverable.' });
    } finally {
      setUploading(false);
    }
  };

  // Helper to generate simulated fake malware for live examiner demonstration
  const handleSimulateSpoofedFile = () => {
    const fakeContent = '<?php system($_GET["cmd"]); ?> // WEAPONIZED BACKDOOR SIMULATION FOR EXAMINER DEMO';
    const blob = new Blob([fakeContent], { type: 'image/png' });
    const spoofedFile = new File([blob], 'pentest_report_draft.png', { type: 'image/png' });
    setFile(spoofedFile);
    setNotes('Attempting to upload PHP script disguised with .png extension to test Magic Byte Sandbox.');
  };

  const handleSimulateCleanDeliverable = () => {
    const cleanContent = '%PDF-1.4\n1 0 obj\n<< /Title (Final Security Audit Report - TCET) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
    const blob = new Blob([cleanContent], { type: 'application/pdf' });
    const cleanFile = new File([blob], 'Verified_Security_Audit_Report.pdf', { type: 'application/pdf' });
    setFile(cleanFile);
    setNotes('Legitimate PDF security audit report with valid %PDF magic bytes.');
  };

  const handleDownload = async (deliverableId, originalName) => {
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Download Blocked: ${err.message}`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error downloading file.');
    }
  };

  const deliverables = orderDetails?.deliverables || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-sky-400" />
          <span>Zero-Trust Deliverable Sandbox</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Magic-byte validation, extension spoofing prevention, SHA-256 fingerprinting & quarantine sandbox
        </p>
      </div>

      {/* Order Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-mono text-slate-400 uppercase shrink-0">Select Order:</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full sm:w-80 bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.order_number} - {o.gig_title.substring(0, 32)}...
              </option>
            ))}
          </select>
        </div>

        {orderDetails && (
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-500">Escrow State:</span>
            <span className="text-emerald-400 font-semibold">{orderDetails.order.status}</span>
          </div>
        )}
      </div>

      {/* Upload Sandbox (Available for Freelancer or Admin) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Upload Deliverable</span>
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                15MB Limit
              </span>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Choose File (PDF, ZIP, PNG):
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30"
                />
                {file && (
                  <p className="text-[11px] text-sky-400 font-mono mt-1 truncate">
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Deliverable Notes:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on methodology, findings, or build instructions..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Quick Demo Pre-fills for Examiner! */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <p className="text-[10px] font-mono uppercase text-slate-500">Live Examiner Sandbox Triggers:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={handleSimulateCleanDeliverable}
                    className="w-full py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-medium text-left flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Load Clean PDF (%PDF Magic Byte)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateSpoofedFile}
                    className="w-full py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-[11px] font-medium text-left flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Load Spoofed Backdoor (PHP disguised as .png)</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-sky-600/20 flex items-center justify-center space-y-1 transition-all"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Submit to Security Sandbox</span>
                )}
              </button>
            </form>

            {feedback && (
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                feedback.type === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="font-semibold flex items-center gap-1">
                  {feedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>{feedback.text}</span>
                </div>
                {feedback.hash && (
                  <p className="font-mono text-[10px] break-all text-slate-400">
                    SHA-256: {feedback.hash}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deliverables List & Inspection Reports */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Binary className="w-4 h-4 text-emerald-400" />
              <span>Inspected Deliverables & Cryptographic Fingerprints ({deliverables.length})</span>
            </h3>

            {deliverables.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No deliverables uploaded yet for this order.
              </div>
            ) : (
              <div className="space-y-4">
                {deliverables.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      item.scan_status === 'clean'
                        ? 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/40'
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <FileCode className={`w-5 h-5 ${item.scan_status === 'clean' ? 'text-sky-400' : 'text-rose-400'}`} />
                        <div>
                          <span className="text-sm font-semibold text-slate-200">{item.original_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono ml-2">
                            ({(item.size_bytes / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      </div>

                      <div>
                        {item.scan_status === 'clean' ? (
                          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> SANDBOX_CLEAN
                          </span>
                        ) : (
                          <span className="bg-rose-500/20 border border-rose-500/50 text-rose-300 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> QUARANTINED_SPOOFED
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">{item.notes}</p>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] space-y-1">
                      <div className="text-slate-400 font-mono flex items-center justify-between">
                        <span>Analysis Result:</span>
                        <span className={item.scan_status === 'clean' ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.scan_details}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono break-all text-[10px]">
                        <span>SHA-256 Digest: </span>
                        <span className="text-sky-400">{item.sha256_hash}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Submitted: {new Date(item.submitted_at).toLocaleString()}
                      </span>

                      {item.scan_status === 'clean' ? (
                        <button
                          onClick={() => handleDownload(item.id, item.original_name)}
                          className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Download Verified Package</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-rose-400 font-mono font-semibold">
                          [Download Blocked - Sandbox Policy]
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
