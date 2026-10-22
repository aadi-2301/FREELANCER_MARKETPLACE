import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FileCheck2,
  MessageSquare,
  Clock,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

export const OrdersView = ({ onOpenChat, onOpenDeliverables }) => {
  const { user, authFetch, refreshUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleReleaseEscrow = async (orderId, orderNum) => {
    if (!window.confirm(`Are you sure you want to approve Order #${orderNum} and release the locked escrow payout?`)) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/orders/${orderId}/release`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', text: `Escrow released! Payout transferred to freelancer.` });
        await fetchOrders();
        await refreshUser();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Escrow release failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Server error releasing escrow.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (orderId, orderNum) => {
    const reason = window.prompt(`Enter dispute rationale for Order #${orderNum}:`, 'Deliverable does not meet security requirements.');
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'warn', text: `Order placed under dispute. Escrow funds frozen in arbitration.` });
        await fetchOrders();
      } else {
        setFeedback({ type: 'error', text: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to register dispute.' });
    } finally {
      setActionLoading(false);
    }
  };

  const copyTxHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'escrow_locked':
        return <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1"><Lock className="w-3 h-3" /> ESCROW_LOCKED</span>;
      case 'in_progress':
        return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> WORK_IN_PROGRESS</span>;
      case 'delivered':
        return <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1"><FileCheck2 className="w-3 h-3" /> DELIVERED_PENDING_REVIEW</span>;
      case 'completed':
        return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ESCROW_RELEASED</span>;
      case 'disputed':
        return <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> DISPUTE_FREEZE</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded text-[11px] font-mono">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-sky-400" />
            <span>Escrow Contracts & Orders</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            State Machine: PENDING_ESCROW → FUNDS_LOCKED → IN_PROGRESS → DELIVERED → RELEASED
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Role Filter: <span className="text-sky-400 font-semibold uppercase">{user?.role}</span> (BOLA/IDOR Enforced)
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          feedback.type === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
          'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white font-mono">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Loading Escrow Ledger records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
          <Lock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Orders in Vault</h3>
          <p className="text-xs text-slate-500">You do not have any active escrow contracts under role '{user?.role}'.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all space-y-5"
            >
              {/* Order Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold font-mono text-sky-400">#{ord.order_number}</span>
                  {statusBadge(ord.status)}
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-mono">
                    Tier: {ord.package_tier}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">LOCKED IN ESCROW</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">${ord.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order Info & Parties */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gig Title */}
                <div className="md:col-span-2 space-y-2">
                  <h4 className="text-base font-semibold text-white">{ord.gig_title}</h4>
                  <p className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500">Requirements: </span>
                    {ord.requirements || 'Standard milestone specifications.'}
                  </p>
                </div>

                {/* Counterparty Info */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Client:</span>
                    <span className="text-slate-200 font-semibold">{ord.client_name} (@{ord.client_username})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Freelancer:</span>
                    <span className="text-slate-200 font-semibold">{ord.freelancer_name} (@{ord.freelancer_username})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                    <span>Created:</span>
                    <span className="text-slate-300 font-mono">{new Date(ord.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Escrow TxHash */}
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-slate-500 shrink-0">Escrow TxHash:</span>
                  <span className="text-sky-300 truncate">{ord.escrow_tx_hash}</span>
                </div>
                <button
                  onClick={() => copyTxHash(ord.escrow_tx_hash)}
                  className="ml-2 text-slate-400 hover:text-sky-400 p-1"
                  title="Copy Transaction Hash"
                >
                  {copiedHash === ord.escrow_tx_hash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenDeliverables(ord.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Deliverables & Sandbox</span>
                  </button>

                  <button
                    onClick={() => onOpenChat(ord.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Encrypted Chat</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Dispute Button */}
                  {ord.status !== 'completed' && ord.status !== 'disputed' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleDispute(ord.id, ord.order_number)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium transition-all"
                    >
                      Raise Dispute
                    </button>
                  )}

                  {/* Escrow Release Button (Client or Admin only) */}
                  {(user?.id === ord.client_id || user?.role === 'admin') && ord.status === 'delivered' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleReleaseEscrow(ord.id, ord.order_number)}
                      className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Approve & Release Escrow (${ord.amount.toFixed(2)})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
