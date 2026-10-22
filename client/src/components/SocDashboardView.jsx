import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Terminal,
  Database
} from 'lucide-react';

export const SocDashboardView = () => {
  const { user, authFetch } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchSocData = async () => {
    setLoading(true);
    try {
      const [mRes, lRes] = await Promise.all([
        authFetch('/api/soc/metrics'),
        authFetch(`/api/soc/logs?severity=${severityFilter}`)
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }
      if (lRes.ok) {
        const lData = await lRes.json();
        setLogs(lData.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocData();
  }, [severityFilter, user]);

  const severityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-500/20 text-orange-300 border border-orange-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold">HIGH</span>;
      case 'WARN':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono">WARN</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" />
            <span>Security Operations Center (SOC) Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Real-time SIEM event streaming, threat correlation, and tamper-evident audit ledger
          </p>
        </div>

        <button
          onClick={fetchSocData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Total Audit Events</div>
            <div className="text-2xl font-black font-mono text-white">{metrics.totalAuditEvents}</div>
            <div className="text-[10px] text-slate-500 font-mono">Chained Records</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[11px] font-mono text-rose-400 uppercase">Blocked Attacks</div>
            <div className="text-2xl font-black font-mono text-rose-400">{metrics.blockedAttacks}</div>
            <div className="text-[10px] text-slate-500 font-mono">IDOR + XSS + Spoofing</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[11px] font-mono text-amber-400 uppercase">Quarantined Files</div>
            <div className="text-2xl font-black font-mono text-amber-400">{metrics.quarantinedFiles}</div>
            <div className="text-[10px] text-slate-500 font-mono">Malware Sandbox Diverted</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[11px] font-mono text-emerald-400 uppercase">Locked Escrow Vault</div>
            <div className="text-2xl font-black font-mono text-emerald-400">${metrics.currentlyLockedEscrow?.toFixed(2) || '0.00'}</div>
            <div className="text-[10px] text-slate-500 font-mono">Active Smart Contracts</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 col-span-2 lg:col-span-1">
            <div className="text-[11px] font-mono text-purple-400 uppercase">Ledger Integrity</div>
            <div className="flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold font-mono text-emerald-400">{metrics.chainIntegrity}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">HMAC-SHA256 Validated</div>
          </div>
        </div>
      )}

      {/* Severity Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Severity Filter:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'WARN', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                severityFilter === sev
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-500">Showing {logs.length} logged incidents</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Incident Details</th>
                <th className="py-3 px-4">HMAC Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-sky-400 font-bold">#{item.id}</td>
                  <td className="py-3 px-4">{severityBadge(item.severity)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{item.event_type}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {item.user_id ? `User #${item.user_id}` : 'Anonymous / System'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{item.ip_address}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={item.details}>
                    {item.details}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[10px] truncate max-w-[120px]" title={item.current_hash}>
                    {item.current_hash ? item.current_hash.substring(0, 16) + '...' : 'GENESIS'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
