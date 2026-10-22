import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Lock
} from 'lucide-react';

export const MarketplaceView = ({ onSelectGig }) => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    'All',
    'Cyber Security',
    'Web Development',
    'Blockchain Security',
    'Cloud Security'
  ];

  const fetchGigs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/gigs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGigs(data.gigs || []);
      }
    } catch (err) {
      console.error('Failed to fetch gigs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGigs();
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-900 border border-sky-900/40 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Signature Escrow & Zero-Trust Sandbox Protected</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Hire Elite Freelancers with <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Cryptographic Escrow</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            FreelanceShield eliminates marketplace fraud and malware deliverables. Every transaction is locked in a cryptographic smart escrow vault, every deliverable is inspected in a zero-trust sandbox, and all activities are recorded in a tamper-evident audit ledger.
          </p>

          {/* Quick stats banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <div className="text-xl font-bold font-mono text-cyan-400">100%</div>
              <div className="text-xs text-slate-400">OWASP Hardened</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-emerald-400">SHA-256</div>
              <div className="text-xs text-slate-400">Tamper-Proof Audit</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-sky-400">Zero-Trust</div>
              <div className="text-xs text-slate-400">Deliverable Sandbox</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-purple-400">BOLA/IDOR</div>
              <div className="text-xs text-slate-400">Object RBAC Matrix</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search pentesting, smart contracts, web dev..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </form>

          {/* Sorting */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value="newest">Recently Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gigs Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Loading verified services...</p>
        </div>
      ) : gigs.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-xl border border-slate-800 p-8">
          <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Services Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters or browse other categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              onClick={() => onSelectGig(gig.id)}
              className="group bg-slate-900/90 rounded-2xl border border-slate-800/90 overflow-hidden hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Cover Image & Category Pill */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={gig.cover_image}
                  alt={gig.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

                <div className="absolute top-3 left-3">
                  <span className="bg-slate-900/80 backdrop-blur-md border border-slate-700 text-sky-400 text-[11px] font-medium px-2.5 py-1 rounded-md">
                    {gig.category}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit {gig.security_rating}</span>
                </div>
              </div>

              {/* Gig Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Seller Bio Row */}
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={gig.seller_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=seller'}
                      alt={gig.seller_username}
                      className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-semibold text-slate-200 truncate">{gig.seller_name}</span>
                        {gig.is_verified === 1 && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">@{gig.seller_username}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{gig.seller_rating ? gig.seller_rating.toFixed(1) : '5.0'}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug">
                    {gig.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {gig.description}
                  </p>
                </div>

                {/* Footer with Price & Escrow Lock Info */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-slate-400 text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{gig.tier_basic_days} Days</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Starting at</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      ${gig.tier_basic_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
