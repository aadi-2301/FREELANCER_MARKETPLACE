import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

export const CreateGigModal = ({ onClose, onSuccess }) => {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Cyber Security',
    description: '',
    cover_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    tier_basic_title: 'Standard Security Assessment',
    tier_basic_price: 250,
    tier_basic_days: 3,
    tier_basic_features: ['Vulnerability Scan', 'OWASP Top 10 Report', 'Executive Summary'],
    security_rating: 'A+'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.tier_basic_price) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authFetch('/api/gigs', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(data.message || 'Failed to publish gig.');
      }
    } catch (err) {
      setErrorMsg('Network error publishing gig.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Publish New Cybersecurity Service Gig</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Gig Title:</label>
            <input
              type="text"
              placeholder="e.g. Full Scope Cloud Infrastructure Vulnerability Audit..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Category:</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Cyber Security">Cyber Security</option>
                <option value="Web Development">Web Development</option>
                <option value="Blockchain Security">Blockchain Security</option>
                <option value="Cloud Security">Cloud Security</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Security Audit Rating:</label>
              <select
                value={formData.security_rating}
                onChange={(e) => setFormData({ ...formData, security_rating: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="A+">A+ (Formal Verification)</option>
                <option value="A">A (OWASP Tested)</option>
                <option value="B+">B+ (Peer Reviewed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Detailed Description:</label>
            <textarea
              rows={4}
              placeholder="Explain methodology, testing phases, tools used, and final deliverable contents..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-semibold text-sky-400 font-mono uppercase text-[11px]">Pricing & Turnaround Tier</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Price (USD):</label>
                <input
                  type="number"
                  min="20"
                  value={formData.tier_basic_price}
                  onChange={(e) => setFormData({ ...formData, tier_basic_price: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Delivery Time (Days):</label>
                <input
                  type="number"
                  min="1"
                  value={formData.tier_basic_days}
                  onChange={(e) => setFormData({ ...formData, tier_basic_days: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-sky-600/20 transition-all"
            >
              {loading ? 'Publishing...' : 'Publish Service to Marketplace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
