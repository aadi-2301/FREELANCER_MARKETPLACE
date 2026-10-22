import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MarketplaceView } from './components/MarketplaceView';
import { OrdersView } from './components/OrdersView';
import { DeliverablesView } from './components/DeliverablesView';
import { ChatView } from './components/ChatView';
import { ExaminerDemoView } from './components/ExaminerDemoView';
import { SocDashboardView } from './components/SocDashboardView';
import { GigDetailModal } from './components/GigDetailModal';
import { CreateGigModal } from './components/CreateGigModal';
import { ShieldCheck, GraduationCap, Lock, Heart } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTabState] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['marketplace', 'orders', 'deliverables', 'messages', 'examiner', 'soc'].includes(hash) ? hash : 'marketplace';
  });

  const setActiveTab = (tab) => {
    window.location.hash = tab;
    setActiveTabState(tab);
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['marketplace', 'orders', 'deliverables', 'messages', 'examiner', 'soc'].includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [preselectedOrderId, setPreselectedOrderId] = useState(null);
  const [isCreateGigOpen, setIsCreateGigOpen] = useState(false);

  const handleOpenChat = (orderId) => {
    setPreselectedOrderId(orderId);
    setActiveTab('messages');
  };

  const handleOpenDeliverables = (orderId) => {
    setPreselectedOrderId(orderId);
    setActiveTab('deliverables');
  };

  const handleOrderSuccess = (orderId) => {
    setPreselectedOrderId(orderId);
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateGig={() => setIsCreateGigOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'marketplace' && (
          <MarketplaceView onSelectGig={(id) => setSelectedGigId(id)} />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            onOpenChat={handleOpenChat}
            onOpenDeliverables={handleOpenDeliverables}
          />
        )}

        {activeTab === 'deliverables' && (
          <DeliverablesView preselectedOrderId={preselectedOrderId} />
        )}

        {activeTab === 'messages' && (
          <ChatView preselectedOrderId={preselectedOrderId} />
        )}

        {activeTab === 'examiner' && (
          <ExaminerDemoView />
        )}

        {activeTab === 'soc' && (
          <SocDashboardView />
        )}
      </main>

      {/* Gig Details & Escrow Purchase Modal */}
      {selectedGigId && (
        <GigDetailModal
          gigId={selectedGigId}
          onClose={() => setSelectedGigId(null)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Publish Gig Modal (Freelancer Only) */}
      {isCreateGigOpen && (
        <CreateGigModal
          onClose={() => setIsCreateGigOpen(false)}
          onSuccess={() => {
            setIsCreateGigOpen(false);
            setActiveTab('marketplace');
          }}
        />
      )}

      {/* Institutional Academic Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2 font-bold text-slate-200 text-sm">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <span>FreelanceShield Marketplace</span>
                <span className="text-slate-500 font-normal">| Industrial Practices Project</span>
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">
                Department of Computer Science & Engineering (Cyber Security) • TCET Mumbai
              </p>
            </div>

            <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
              <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                Scheme: CBCGS-HME 2023 Autonomy
              </span>
              <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-emerald-400">
                University of Mumbai
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-2">
            <div>
              Developed for Third Year Industrial Practices (IP) Defense & Examination.
            </div>
            <div className="flex items-center space-x-4">
              <span>Zero-Trust Sandbox</span>
              <span>•</span>
              <span>HMAC-SHA256 Audit Trail</span>
              <span>•</span>
              <span>Smart Escrow</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
