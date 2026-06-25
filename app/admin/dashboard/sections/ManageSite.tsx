'use client';

import { useState, useEffect } from 'react';

export default function ManageSiteSection() {
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data?type=site')
      .then(res => res.json())
      .then(data => {
        setSite(data || {
          siteName: 'Rumah Familiku',
          logoText: 'RF',
          whatsappNumber: '628787695752',
          email: 'rumahfamiliku@gmail.com',
          instagramUrl: 'https://instagram.com',
          footerTagline: 'Hunian Syariah Nyaman untuk Keluarga',
          copyrightText: '© 2024 Rumah Familiku Syariah. All rights reserved.'
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    await fetch('/api/admin/data?type=site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Header & Footer</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Site Name</label>
            <input type="text" value={site.siteName} onChange={e => setSite({...site, siteName: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Logo Text</label>
            <input type="text" value={site.logoText} onChange={e => setSite({...site, logoText: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-bold text-lg mb-2">Contact Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>WhatsApp Number</label>
              <input type="text" value={site.whatsappNumber} onChange={e => setSite({...site, whatsappNumber: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={site.email} onChange={e => setSite({...site, email: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label>Instagram URL</label>
              <input type="text" value={site.instagramUrl} onChange={e => setSite({...site, instagramUrl: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-bold text-lg mb-2">Footer</h3>
          <div className="space-y-3">
            <input placeholder="Footer Tagline" value={site.footerTagline} onChange={e => setSite({...site, footerTagline: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            <input placeholder="Copyright Text" value={site.copyrightText} onChange={e => setSite({...site, copyrightText: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <button onClick={handleSave} className="bg-brand-green text-white px-6 py-2 rounded-lg">
          {saved ? '✓ Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}