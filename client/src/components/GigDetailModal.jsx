import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const GigDetailModal = ({ gigId, onClose, onOrderSuccess }) => {
  const { user, authFetch, refreshUser } = useAuth();
  const [gigData, setGigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('standard');
  const [requirements, setRequirements] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchGigDetails = async () => {
      try {
        const res = await fetch(`/api/gigs/${gigId}`);
        if (res.ok) {
          const data = await res.json();
          setGigData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (gigId) fetchGigDetails();
  }, [gigId]);

  if (!gigId) return null;

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setOrderLoading(true);

    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          gig_id: gigId,
          package_tier: selectedTier,
          requirements: requirements || 'Standard project scope as defined in gig description.'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Order placed successfully! Funds ($${data.amount}) locked in Escrow Vault. TxHash: ${data.escrowTxHash.substring(0, 16)}...`);
        await refreshUser();
        setTimeout(() => {
          if (onOrderSuccess) onOrderSuccess(data.orderId);
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.message || 'Failed to place order.');
      }
    } catch (err) {
      setErrorMsg('Network or server error occurred.');
    } finally {
      setOrderLoading(false);
    }
  };

  const gig = gigData?.gig;
  const reviews = gigData?.reviews || [];

  const tierPrices = {
    basic: gig?.tier_basic_price,
    standard: gig?.tier_standard_price,
    premium: gig?.tier_premium_price
  };

  const tierDays = {
    basic: gig?.tier_basic_days,
    standard: gig?.tier_standard_days,
    premium: gig?.tier_premium_days
  };

  const tierFeatures = {
    basic: gig?.tier_basic_features || [],
    standard: gig?.tier_standard_features || [],
    premium: gig?.tier_premium_features || []
  };

  const activePrice = tierPrices[selectedTier] || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs px-2.5 py-0.5 rounded font-mono font-medium">
              {gig?.category || 'Service Detail'}
            </span>
            <div className="flex items-center space-x-1 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Rating: {gig?.security_rating || 'A+'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono">Retrieving encrypted gig credentials...</p>
          </div>
        ) : !gig ? (
          <div className="py-16 text-center text-slate-400">Gig details not found.</div>
        ) : (
          <div className="overflow-y-auto p-6 space-y-6 flex-1">
            {/* Title & Seller banner */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {gig.title}
              </h2>
              <div className="flex items-center space-x-3 mt-3">
                <img
                  src={gig.seller_avatar}
                  alt={gig.seller_username}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-semibold text-slate-200">{gig.seller_name}</span>
                    <span className="text-xs text-slate-400">(@{gig.seller_username})</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current mr-1" />
                      {gig.seller_rating.toFixed(1)} ({gig.seller_reviews} reviews)
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400">Verified Freelancer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Grid: Left Details & Right Tier Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Cols): Description, Seller Bio & Reviews */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl overflow-hidden border border-slate-800 h-64 bg-slate-950">
                  <img
                    src={gig.cover_image}
                    alt={gig.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    Service Scope & Deliverables
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {gig.description}
                  </p>
                </div>

                {/* Seller Bio Card */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-mono uppercase text-slate-400">About the Cybersecurity Specialist</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{gig.seller_bio}</p>
                </div>

                {/* Client Reviews */}
                {reviews.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase text-slate-400">Verified Client Reviews</h4>
                    <div className="space-y-2">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">@{rev.reviewer_username}</span>
                            <div className="flex items-center text-amber-400">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-300">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (1 Col): Tier Selection & Escrow Checkout */}
              <div className="space-y-4">
                {/* Tier Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {['basic', 'standard', 'premium'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        selectedTier === tier
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                {/* Active Package Details Card */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-mono block">Package Price</span>
                      <span className="text-2xl font-black font-mono text-emerald-400">
                        ${activePrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {tierDays[selectedTier]} Days Delivery
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-medium pb-2 border-b border-slate-800">
                    {selectedTier === 'basic' && gig.tier_basic_title}
                    {selectedTier === 'standard' && gig.tier_standard_title}
                    {selectedTier === 'premium' && gig.tier_premium_title}
                  </div>

                  {/* Included features checklist */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block">Package Inclusions:</span>
                    {tierFeatures[selectedTier].map((feat, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Escrow Vault Assurance Pill */}
                  <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/20 text-[11px] text-sky-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-400" /> Cryptographic Escrow Vault
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Payment is held in a tamper-resistant escrow contract. Freelancer receives payout only AFTER you review the sandbox-verified deliverable.
                    </p>
                  </div>

                  {/* Requirements Note */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">
                      Target Scope / Requirements:
                    </label>
                    <textarea
                      rows={2}
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="e.g. Test staging API endpoints, or deliver full source repository..."
                      className="w-full p-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Feedback Messages */}
                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    disabled={orderLoading || user?.id === gig.freelancer_id}
                    onClick={handlePlaceOrder}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    {orderLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : user?.id === gig.freelancer_id ? (
                      <span>You Own This Gig</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Lock Escrow & Purchase (${activePrice.toFixed(2)})</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Current Client Balance: ${user?.wallet_balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
