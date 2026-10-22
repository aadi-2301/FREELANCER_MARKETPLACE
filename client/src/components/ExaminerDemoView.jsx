import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Play,
  Lock,
  RefreshCw,
  AlertTriangle,
  Bug,
  CheckCircle2,
  FileCode,
  Key,
  Database
} from 'lucide-react';

export const ExaminerDemoView = () => {
  const { user, token, authFetch } = useAuth();

  // Test 1: IDOR
  const [idorLoading, setIdorLoading] = useState(false);
  const [idorResult, setIdorResult] = useState(null);

  // Test 2: XSS
  const [xssInput, setXssInput] = useState('<script>alert("Cookie: " + document.cookie)</script><img src=x onerror=alert(1)>');
  const [xssLoading, setXssLoading] = useState(false);
  const [xssResult, setXssResult] = useState(null);

  // Test 3: Brute Force
  const [bfLoading, setBfLoading] = useState(false);
  const [bfResult, setBfResult] = useState(null);

  // Test 4: Audit Chain
  const [chainLoading, setChainLoading] = useState(false);
  const [chainResult, setChainResult] = useState(null);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [tamperFeedback, setTamperFeedback] = useState(null);

  /* 1. Run IDOR Test */
  const runIdorTest = async () => {
    setIdorLoading(true);
    setIdorResult(null);
    try {
      const res = await authFetch('/api/security/test-idor');
      const data = await res.json();
      setIdorResult({ status: res.status, ...data });
    } catch (err) {
      setIdorResult({ error: 'Network error during test' });
    } finally {
      setIdorLoading(false);
    }
  };

  /* 2. Run XSS Test */
  const runXssTest = async () => {
    setXssLoading(true);
    setXssResult(null);
    try {
      const res = await fetch('/api/security/test-xss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: xssInput })
      });
      const data = await res.json();
      setXssResult(data);
    } catch (err) {
      setXssResult({ error: 'Error during test' });
    } finally {
      setXssLoading(false);
    }
  };

  /* 3. Run Brute Force Lockout Simulation */
  const runBruteForceTest = async () => {
    setBfLoading(true);
    setBfResult(null);
    const attempts = [];

    try {
      for (let i = 1; i <= 6; i++) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'alex_client', password: `wrong_pass_${i}` })
        });
        const data = await res.json();
        attempts.push({ attempt: i, status: res.status, message: data.message || data.error });
      }
      setBfResult({ attempts, summary: 'Rate-limiting window evaluated.' });
    } catch (err) {
      setBfResult({ error: err.message });
    } finally {
      setBfLoading(false);
    }
  };

  /* 4. Verify Cryptographic Audit Chain */
  const runChainVerify = async () => {
    setChainLoading(true);
    try {
      const res = await fetch('/api/security/verify-audit-chain');
      const data = await res.json();
      setChainResult(data);
    } catch (err) {
      setChainResult({ error: 'Chain verification failed' });
    } finally {
      setChainLoading(false);
    }
  };

  /* 5. Simulate Database Tampering */
  const handleTamperLog = async () => {
    setTamperLoading(true);
    try {
      const res = await fetch('/api/security/simulate-tamper', { method: 'POST' });
      const data = await res.json();
      setTamperFeedback(data);
      // Automatically re-run verification to show examiner the broken chain!
      await runChainVerify();
    } catch (err) {
      console.error(err);
    } finally {
      setTamperLoading(false);
    }
  };

  const handleRestoreLog = async () => {
    setTamperLoading(true);
    try {
      const res = await fetch('/api/security/restore-tamper', { method: 'POST' });
      const data = await res.json();
      setTamperFeedback(data);
      await runChainVerify();
    } catch (err) {
      console.error(err);
    } finally {
      setTamperLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex items-center space-x-2 text-rose-400 font-mono text-xs uppercase tracking-wider font-semibold">
          <Terminal className="w-4 h-4 text-rose-400" />
          <span>Examiner Defense Test Suite • Live Proof-of-Concept</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Interactive Cybersecurity Defense Harness
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          This interactive test console allows the project examiners to trigger live OWASP attack vectors against the running system and observe how the defense mechanisms, zero-trust sandbox, and HMAC audit ledger actively neutralize each threat in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: BOLA / IDOR Defense */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">1. BOLA / IDOR Attack Defense</h3>
                <p className="text-[10px] text-slate-400 font-mono">OWASP API1:2023 - Broken Object Level Authorization</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded">
              RBAC Matrix
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Simulates an attacker trying to query or steal Order #ORD-2026-SEC01 without valid contract participation rights.
          </p>

          <button
            onClick={runIdorTest}
            disabled={idorLoading}
            className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-sky-600/20"
          >
            {idorLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Execute Unauthorized IDOR Probe</span>
              </>
            )}
          </button>

          {idorResult && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Result:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  idorResult.result === 'BLOCKED' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {idorResult.result} (HTTP {idorResult.httpStatus || 200})
                </span>
              </div>
              <div className="text-slate-400 text-[11px] leading-relaxed">
                <div><span className="text-slate-500">Target: </span>{idorResult.targetResource}</div>
                <div><span className="text-slate-500">Identity: </span>{idorResult.attackerIdentity}</div>
                <div><span className="text-slate-500">Defense: </span>{idorResult.defenseMechanism}</div>
                <div className="text-emerald-400 mt-1">✓ SOC Security Alert Logged: {String(idorResult.socIncidentLogged)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Module 2: XSS Sanitization & CSP */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Bug className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">2. XSS Injection Sanitization & CSP</h3>
                <p className="text-[10px] text-slate-400 font-mono">OWASP A03:2021 - Injection (Cross-Site Scripting)</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
              HTML Escaping
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Attack Payload:</label>
            <input
              type="text"
              value={xssInput}
              onChange={(e) => setXssInput(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-rose-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={runXssTest}
            disabled={xssLoading}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20"
          >
            {xssLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test XSS Neutralizer</span>
              </>
            )}
          </button>

          {xssResult && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  {xssResult.status}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="text-slate-500">Sanitized Output (Safe Entity-Encoded):</div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-emerald-300 break-all">
                  {xssResult.sanitizedOutput}
                </div>
                <div className="text-sky-400 text-[10px] mt-1">
                  ✓ Content-Security-Policy & nosniff headers active
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Module 3: Brute-Force & Rate Limiting */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Key className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">3. Brute-Force Rate Limiting</h3>
                <p className="text-[10px] text-slate-400 font-mono">Credential Stuffing & Dictionary Attack Defense</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
              express-rate-limit
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Fires rapid invalid credential attempts against <code className="text-sky-400 font-mono">/api/auth/login</code> to demonstrate the sliding-window threshold.
          </p>

          <button
            onClick={runBruteForceTest}
            disabled={bfLoading}
            className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-600/20"
          >
            {bfLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Simulate 6 Rapid Password Attacks</span>
              </>
            )}
          </button>

          {bfResult && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 max-h-40 overflow-y-auto">
              <div className="text-slate-400 font-bold mb-1">Attempt Telemetry Stream:</div>
              {bfResult.attempts?.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Attempt #{att.attempt}:</span>
                  <span className={att.status === 429 ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                    HTTP {att.status} - {att.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 4: Cryptographic HMAC-SHA256 Audit Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Database className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">4. Tamper-Evident HMAC Audit Ledger</h3>
                <p className="text-[10px] text-slate-400 font-mono">Chained Hashes • Digital Forensics Integrity</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
              HMAC-SHA256
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Every audit event is cryptographically linked to the previous entry's hash. Tampering with any historical row breaks the entire downstream hash chain!
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={runChainVerify}
              disabled={chainLoading}
              className="py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Chain Integrity</span>
            </button>

            <button
              onClick={handleTamperLog}
              disabled={tamperLoading}
              className="py-2 px-3 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Tamper With Record</span>
            </button>
          </div>

          {tamperFeedback && (
            <div className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg flex items-center justify-between">
              <span>{tamperFeedback.message}</span>
              <button
                onClick={handleRestoreLog}
                className="underline text-sky-400 hover:text-sky-300 text-[10px]"
              >
                Restore Original
              </button>
            </div>
          )}

          {chainResult && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ledger Verification:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  chainResult.valid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400 animate-pulse'
                }`}>
                  {chainResult.valid ? 'VALID_UNALTERED' : 'CHAIN_TAMPERED!'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                <p>{chainResult.message}</p>
                {!chainResult.valid && (
                  <div className="mt-2 p-2 bg-rose-950/40 rounded border border-rose-500/40 text-rose-300 space-y-1">
                    <div><span className="text-slate-400">Tampered Record ID: </span>#{chainResult.brokenAtId}</div>
                    <div><span className="text-slate-400">Violation Reason: </span>{chainResult.reason}</div>
                  </div>
                )}
                {chainResult.latestHash && (
                  <p className="text-[10px] text-slate-500 truncate mt-1">
                    Latest Merkle Head: {chainResult.latestHash}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
