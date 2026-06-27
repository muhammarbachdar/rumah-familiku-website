'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManageHomeSection from './sections/ManageHome';
import ManagePricesSection from './sections/ManagePrices';
import ManagePromosSection from './sections/ManagePromos';
import ManagePropertiesSection from './sections/ManageProperties';
import ManageFAQSection from './sections/ManageFAQ';
import ManageAboutSection from './sections/ManageAbout';
import ManageAppearanceSection from './sections/ManageAppearance';
import ManageSiteSection from './sections/ManageSite';
import ManageAvailabilitySection from './sections/ManageAvailability';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk data overview
  const [totalProperties, setTotalProperties] = useState(0);
  const [activePromos, setActivePromos] = useState(0);
  const [totalFaqs, setTotalFaqs] = useState(0);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Fetch data overview
  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoadingOverview(true);
      try {
        const propertiesRes = await fetch('/api/admin/data?type=properties');
        const propertiesData = await propertiesRes.json();
        setTotalProperties(propertiesData?.length || 0);

        const promosRes = await fetch('/api/admin/data?type=promos');
        const promosData = await promosRes.json();
        const activeCount = promosData?.filter((p: any) => p.active === true).length || 0;
        setActivePromos(activeCount);

        const faqsRes = await fetch('/api/admin/data?type=faqs');
        const faqsData = await faqsRes.json();
        setTotalFaqs(faqsData?.length || 0);
      } catch (error) {
        console.error('Failed to fetch overview data:', error);
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverviewData();
  }, []);

  const handleLogout = async () => {
    // Hapus session via API (httpOnly cookie akan dihapus server-side)
    await fetch('/api/admin/logout', { method: 'POST' });
    // Redirect ke halaman login
    router.push('/admin');
    router.refresh();
  };

  // Tutup sidebar saat klik di luar (overlay) di mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay untuk mobile saat sidebar terbuka */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-brand-green text-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green font-bold">
              RF
            </div>
            <span className="font-bold">Rumah Familiku</span>
          </div>

          <nav className="space-y-2">
            <button onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'overview' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>📊 Dashboard</button>
            <button onClick={() => { setActiveTab('prices'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'prices' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>💰 Manage Prices</button>
            <button onClick={() => { setActiveTab('promos'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'promos' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>🎁 Manage Promos</button>
            <button onClick={() => { setActiveTab('properties'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'properties' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>🏠 Manage Properties</button>
            <button onClick={() => { setActiveTab('faq'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'faq' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>❓ Manage FAQ</button>
            <button onClick={() => { setActiveTab('about'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'about' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>ℹ️ Manage About</button>
            <button onClick={() => { setActiveTab('appearance'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'appearance' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>🎨 Manage Appearance</button>
            <button onClick={() => { setActiveTab('site'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'site' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>📝 Manage Header & Footer</button>
            <button onClick={() => { setActiveTab('home'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'home' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>🏠 Manage Home</button>
            <button onClick={() => { setActiveTab('availability'); setSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'availability' ? 'bg-green-hover' : 'hover:bg-green-hover/50'}`}>📅 Manage Availability</button>
          </nav>

          <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded mt-8 hover:bg-red-500/50 transition">🚪 Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {/* Header dengan tombol hamburger untuk mobile */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-brand-green text-white hover:bg-green-hover transition"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-charcoal">Admin Dashboard</h1>
          </div>

          {/* ===== OVERVIEW ===== */}
          <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-text text-sm mb-2">Total Properties</p>
                <p className="text-3xl font-bold text-brand-green">
                  {loadingOverview ? '...' : totalProperties}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-text text-sm mb-2">Active Promos</p>
                <p className="text-3xl font-bold text-gold">
                  {loadingOverview ? '...' : activePromos}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-text text-sm mb-2">FAQ Items</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loadingOverview ? '...' : totalFaqs}
                </p>
              </div>
            </div>
          </div>

          {/* ===== SEMUA SECTION DI-RENDER TAPI DISEMBUNYIKAN ===== */}
          <div style={{ display: activeTab === 'prices' ? 'block' : 'none' }}>
            <ManagePricesSection />
          </div>
          <div style={{ display: activeTab === 'promos' ? 'block' : 'none' }}>
            <ManagePromosSection />
          </div>
          <div style={{ display: activeTab === 'properties' ? 'block' : 'none' }}>
            <ManagePropertiesSection />
          </div>
          <div style={{ display: activeTab === 'faq' ? 'block' : 'none' }}>
            <ManageFAQSection />
          </div>
          <div style={{ display: activeTab === 'about' ? 'block' : 'none' }}>
            <ManageAboutSection />
          </div>
          <div style={{ display: activeTab === 'appearance' ? 'block' : 'none' }}>
            <ManageAppearanceSection />
          </div>
          <div style={{ display: activeTab === 'site' ? 'block' : 'none' }}>
            <ManageSiteSection />
          </div>
          <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
            <ManageHomeSection />
          </div>
          <div style={{ display: activeTab === 'availability' ? 'block' : 'none' }}>
            <ManageAvailabilitySection />
          </div>
        </div>
      </div>
    </div>
  );
}