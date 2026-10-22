import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Send,
  Lock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';

export const ChatView = ({ preselectedOrderId }) => {
  const { user, authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

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

  const fetchMessages = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/messages/order/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
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

  useEffect(() => {
    if (selectedOrderId) {
      fetchMessages(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedOrderId) return;

    setSending(true);
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          order_id: selectedOrderId,
          message: inputMsg
        })
      });

      if (res.ok) {
        setInputMsg('');
        await fetchMessages(selectedOrderId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          <span>Encrypted Order Messaging & DLP Shield</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          End-to-End messaging with automated Data Loss Prevention (DLP) anti-circumvention filter
        </p>
      </div>

      {/* Order Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-mono text-slate-400 uppercase shrink-0">Order Thread:</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full sm:w-80 bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.order_number} - {o.gig_title.substring(0, 32)}...
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE Channel Simulation Active</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-mono">Decrypting message channel...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-24 text-center text-slate-500 text-xs font-mono">
              No messages exchanged yet in this order channel.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center space-x-1.5 mb-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">@{m.sender_username}</span>
                    <span>•</span>
                    <span className="font-mono">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs space-y-2 ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/80'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>

                    {/* DLP Violation Flag */}
                    {m.dlp_flagged === 1 && (
                      <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-[10px] text-rose-200 flex items-start space-x-1.5 font-mono">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">DLP POLICY TRIGGERED: </span>
                          <span>{m.dlp_warning}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar with Quick Examiner Demo Triggers */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
          {/* Quick Demo Pre-fill Buttons */}
          <div className="flex items-center space-x-2 text-[10px] overflow-x-auto pb-1 font-mono">
            <span className="text-slate-500 uppercase shrink-0">Examiner Triggers:</span>
            <button
              type="button"
              onClick={() => setInputMsg('Please check the updated findings report in the sandbox.')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
            >
              Legitimate Message
            </button>
            <button
              type="button"
              onClick={() => setInputMsg('Can you email me at alex.hacker@evilbank.com or call +1 555-019-2834?')}
              className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap"
            >
              Simulate Off-Platform Scam (Email/Phone)
            </button>
            <button
              type="button"
              onClick={() => setInputMsg('Here is my payment card: 4532 8923 1122 3456 with CVV 992')}
              className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap"
            >
              Simulate Credit Card Leak
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Type encrypted message (DLP checks enabled)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || sending}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
