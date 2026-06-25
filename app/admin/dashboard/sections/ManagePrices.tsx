'use client';

import { useState, useEffect } from 'react';

export default function ManagePricesSection() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    weekday: 0, weekend: 0,
    pricingMode: 'wni-wna',
    monthlyPrice: 0,
    monthlyPricingWNI: 0, 
    monthlyPricingWNA: 0 
  });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const res = await fetch('/api/admin/data?type=properties');
    const data = await res.json();
    setProperties(data || []);
    setLoading(false);
  };
  const saveToAPI = async (data: any) => {
    await fetch('/api/admin/data?type=properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (item.type === 'kos') {
      const pricingMode = item.pricingMode || (item.monthlyPricingWNI ? 'wni-wna' : 'general');
      setEditForm({
        weekday: 0, weekend: 0,
        pricingMode: pricingMode,
        monthlyPrice: item.monthlyPrice || 0,
        monthlyPricingWNI: item.monthlyPricingWNI || 0,
        monthlyPricingWNA: item.monthlyPricingWNA || 0,
      });
    } else {
      setEditForm({
        weekday: item.pricing?.weekday || 0,
        weekend: item.pricing?.weekend || 0,
        pricingMode: 'wni-wna',
        monthlyPrice: 0,
        monthlyPricingWNI: 0,
        monthlyPricingWNA: 0,
      });
    }
  };

  const handleSave = async () => {
    let updated;
    if (editingItem.type === 'kos') {
      if (editForm.pricingMode === 'general') {
        updated = properties.map(p => p.id === editingItem.id 
          ? { 
              ...p, 
              pricingMode: 'general',
              monthlyPrice: editForm.monthlyPrice,
              monthlyPricingWNI: undefined,
              monthlyPricingWNA: undefined
            } 
          : p
        );
      } else {
        updated = properties.map(p => p.id === editingItem.id 
          ? { 
              ...p, 
              pricingMode: 'wni-wna',
              monthlyPricingWNI: editForm.monthlyPricingWNI,
              monthlyPricingWNA: editForm.monthlyPricingWNA,
              monthlyPrice: undefined
            } 
          : p
        );
      }
    } else {
      updated = properties.map(p => p.id === editingItem.id 
        ? { 
            ...p, 
            pricing: { weekday: editForm.weekday, weekend: editForm.weekend }
          } 
        : p
      );
    }
    setProperties(updated);
    await saveToAPI(updated);
    setEditingItem(null);
  };

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading prices...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-charcoal mb-6">Manage Prices</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr><th className="text-left px-4 py-3">Property</th><th>Type</th><th>Price Display</th><th>Action</th></tr>
          </thead>
          <tbody>
            {properties.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.nameId}</td>
                <td className="px-4 py-3">
                  {item.type === 'hotel' && 'Hotel'}
                  {item.type === 'kos' && 'Kos'}
                  {item.type === 'apartemen' && 'Apartemen'}
                  {item.type === 'rumah' && 'Rumah/Villa'}
                </td>
                <td className="px-4 py-3">
                  {item.type === 'kos' ? (
                    item.pricingMode === 'general' ? (
                      `Rp ${(item.monthlyPrice || 0).toLocaleString('id-ID')}/bulan`
                    ) : (
                      `WNI: Rp ${(item.monthlyPricingWNI || 0).toLocaleString('id-ID')} | WNA: Rp ${(item.monthlyPricingWNA || 0).toLocaleString('id-ID')}/bulan`
                    )
                  ) : (
                    `Weekday: Rp ${(item.pricing?.weekday || 0).toLocaleString('id-ID')} | Weekend: Rp ${(item.pricing?.weekend || 0).toLocaleString('id-ID')}`
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleEdit(item)} className="text-brand-green hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Harga — {editingItem.nameId}</h3>
            
            {editingItem.type === 'kos' ? (
              <div className="space-y-4">
                {/* Mode Pilihan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode Harga</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="pricingMode"
                        value="general"
                        checked={editForm.pricingMode === 'general'}
                        onChange={() => setEditForm({...editForm, pricingMode: 'general'})}
                        className="accent-brand-green"
                      />
                      <span>General (1 harga untuk semua)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="pricingMode"
                        value="wni-wna"
                        checked={editForm.pricingMode === 'wni-wna'}
                        onChange={() => setEditForm({...editForm, pricingMode: 'wni-wna'})}
                        className="accent-brand-green"
                      />
                      <span>WNI / WNA (2 harga berbeda)</span>
                    </label>
                  </div>
                </div>

                {editForm.pricingMode === 'general' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Bulan</label>
                    <input
                      type="number"
                      value={editForm.monthlyPrice}
                      onChange={e => setEditForm({...editForm, monthlyPrice: Number(e.target.value)})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Contoh: 2500000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Harga tunggal untuk semua tamu (WNI dan WNA)</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Bulan (WNI)</label>
                      <input
                        type="number"
                        value={editForm.monthlyPricingWNI}
                        onChange={e => setEditForm({...editForm, monthlyPricingWNI: Number(e.target.value)})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Contoh: 2500000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Bulan (WNA)</label>
                      <input
                        type="number"
                        value={editForm.monthlyPricingWNA}
                        onChange={e => setEditForm({...editForm, monthlyPricingWNA: Number(e.target.value)})}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Contoh: 3000000"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Weekday (per malam)</label>
                  <input
                    type="number"
                    value={editForm.weekday}
                    onChange={e => setEditForm({...editForm, weekday: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Weekend (per malam)</label>
                  <input
                    type="number"
                    value={editForm.weekend}
                    onChange={e => setEditForm({...editForm, weekend: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-hover transition">Simpan</button>
              <button onClick={() => setEditingItem(null)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}