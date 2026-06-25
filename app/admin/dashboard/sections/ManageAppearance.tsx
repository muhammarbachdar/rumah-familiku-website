'use client';

import { useState, useEffect } from 'react';

export default function ManageAppearanceSection() {
  const [appearance, setAppearance] = useState({ 
    primaryColor: '#1B5E20', 
    accentColor: '#C9A84C', 
    backgroundColor: '#FFFFFF' 
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => { 
    fetch('/api/admin/data?type=appearance')
      .then(res => res.json())
      .then(data => { 
        if (data) setAppearance(data); 
        setLoading(false); 
      }); 
  }, []);

  const handleSave = async () => { 
    await fetch('/api/admin/data?type=appearance', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(appearance) 
    }); 
    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  };

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Appearance</h2>
      
      {/* Color Pickers */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Primary Color (Brand Green)</label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={appearance.primaryColor} 
              onChange={e => setAppearance({...appearance, primaryColor: e.target.value})} 
              className="w-12 h-12 border rounded cursor-pointer" 
            />
            <input 
              type="text" 
              value={appearance.primaryColor} 
              onChange={e => setAppearance({...appearance, primaryColor: e.target.value})} 
              className="flex-1 border rounded-lg px-3 py-2 font-mono" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Accent Color (Gold)</label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={appearance.accentColor} 
              onChange={e => setAppearance({...appearance, accentColor: e.target.value})} 
              className="w-12 h-12 border rounded cursor-pointer" 
            />
            <input 
              type="text" 
              value={appearance.accentColor} 
              onChange={e => setAppearance({...appearance, accentColor: e.target.value})} 
              className="flex-1 border rounded-lg px-3 py-2 font-mono" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={appearance.backgroundColor} 
              onChange={e => setAppearance({...appearance, backgroundColor: e.target.value})} 
              className="w-12 h-12 border rounded cursor-pointer" 
            />
            <input 
              type="text" 
              value={appearance.backgroundColor} 
              onChange={e => setAppearance({...appearance, backgroundColor: e.target.value})} 
              className="flex-1 border rounded-lg px-3 py-2 font-mono" 
            />
          </div>
        </div>
      </div>

      {/* Preview Section - Real-time */}
      <div className="border-t pt-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Preview Real-time</h3>
        <div 
          className="rounded-xl p-4 space-y-3 transition-colors duration-150"
          style={{ backgroundColor: appearance.backgroundColor }}
        >
          {/* Mini Header Preview */}
          <div 
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ backgroundColor: appearance.primaryColor }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold" style={{ color: appearance.primaryColor }}>
                RF
              </div>
              <span className="text-white text-sm font-medium">Rumah Familiku</span>
            </div>
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-white/20 rounded"></div>
              <div className="w-6 h-6 bg-white/20 rounded"></div>
            </div>
          </div>

          {/* Mini Property Card Preview */}
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div 
                  className="text-xs font-bold inline-block px-2 py-0.5 rounded-full mb-1"
                  style={{ backgroundColor: appearance.primaryColor, color: 'white' }}
                >
                  Hotel
                </div>
                <p className="text-sm font-semibold text-gray-800">RF Hotel 1 Syariah</p>
                <p className="text-xs text-gray-500">📍 Surabaya</p>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Mulai dari</p>
                <p className="text-lg font-bold" style={{ color: appearance.accentColor }}>Rp 350.000</p>
                <p className="text-xs text-gray-500">/ malam</p>
              </div>
              <button 
                className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors"
                style={{ backgroundColor: appearance.primaryColor }}
              >
                Lihat Detail
              </button>
            </div>
          </div>

          {/* Mini Button Preview */}
          <div className="flex gap-2 pt-2">
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: appearance.primaryColor }}
            >
              Tombol Utama
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
              style={{ borderColor: appearance.primaryColor, color: appearance.primaryColor }}
            >
              Tombol Sekunder
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: appearance.accentColor }}
            >
              Tombol Gold
            </button>
          </div>

          {/* Mini Price Text Preview */}
          <div className="pt-2">
            <p className="text-sm font-semibold" style={{ color: appearance.accentColor }}>
              Harga Promo: Rp 450.000 <span className="text-gray-400 line-through text-xs ml-1">Rp 500.000</span>
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Preview ini berubah secara real-time. Warna akan diterapkan ke seluruh website setelah klik "Save Changes".
          </p>
        </div>
      </div>

      <button 
        onClick={handleSave} 
        className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-green-hover transition"
        style={{ backgroundColor: appearance.primaryColor }}
      >
        {saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}