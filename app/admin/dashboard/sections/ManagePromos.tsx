// ./app/admin/dashboard/sections/ManagePromos.tsx

'use client';

import { useState, useEffect } from 'react';

// ===== PINDAHKAN ModalForm KE LUAR =====
interface ModalFormProps {
  onSave: () => void;
  onClose: () => void;
  title: string;
  form: {
    id: string;
    titleId: string;
    titleEn: string;
    descriptionId: string;
    descriptionEn: string;
    image: string;
    validUntil: string;
    active: boolean;
    propertyIds: string[];
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  properties: any[];
  handlePropertyToggle: (propertyId: string) => void;
}

const ModalForm = ({ 
  onSave, 
  onClose, 
  title, 
  form, 
  setForm, 
  properties,
  handlePropertyToggle 
}: ModalFormProps) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-4">
        <input 
          placeholder="Judul ID" 
          value={form.titleId} 
          onChange={e => setForm({...form, titleId: e.target.value})} 
          className="w-full border rounded-lg px-3 py-2" 
        />
        <input 
          placeholder="Judul EN" 
          value={form.titleEn} 
          onChange={e => setForm({...form, titleEn: e.target.value})} 
          className="w-full border rounded-lg px-3 py-2" 
        />
        <textarea 
          placeholder="Deskripsi ID" 
          rows={2} 
          value={form.descriptionId} 
          onChange={e => setForm({...form, descriptionId: e.target.value})} 
          className="w-full border rounded-lg px-3 py-2" 
        />
        <textarea 
          placeholder="Deskripsi EN" 
          rows={2} 
          value={form.descriptionEn} 
          onChange={e => setForm({...form, descriptionEn: e.target.value})} 
          className="w-full border rounded-lg px-3 py-2" 
        />
        <input 
          placeholder="Image URL" 
          value={form.image} 
          onChange={e => setForm({...form, image: e.target.value})} 
          className="w-full border rounded-lg px-3 py-2" 
        />
        <input 
          type="date" 
          value={form.validUntil} 
          onChange={e => setForm({...form, validUntil: e.target.value})} 
          className="w-full border rounded-lg px-3 py-2" 
        />
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={form.active} 
            onChange={e => setForm({...form, active: e.target.checked})} 
          /> 
          Aktif
        </label>
        
        {/* Multi-select untuk properti yang terkena promo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Properti yang terkena promo (opsional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Kosongkan jika promo berlaku untuk semua properti
          </p>
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
            {properties.map((prop: any) => (
              <label key={prop.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={form.propertyIds.includes(prop.id)}
                  onChange={() => handlePropertyToggle(prop.id)}
                  className="w-4 h-4 accent-brand-green"
                />
                <span className="text-sm">{prop.nameId} ({prop.type})</span>
              </label>
            ))}
            {properties.length === 0 && (
              <p className="text-sm text-gray-400">Loading properti...</p>
            )}
          </div>
          {form.propertyIds.length > 0 && (
            <p className="text-xs text-brand-green mt-2">
              ✓ Promo hanya berlaku untuk {form.propertyIds.length} properti yang dipilih
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onSave} className="flex-1 bg-brand-green text-white py-2 rounded-lg">
          Simpan
        </button>
        <button onClick={onClose} className="flex-1 border py-2 rounded-lg">
          Batal
        </button>
      </div>
    </div>
  </div>
);

// ===== KOMPONEN UTAMA =====
export default function ManagePromosSection() {
  const [promos, setPromos] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ 
    id: '', titleId: '', titleEn: '', 
    descriptionId: '', descriptionEn: '', 
    image: '', validUntil: '', 
    active: true, propertyIds: [] as string[] 
  });

  useEffect(() => { loadData(); }, []);
  
  const loadData = async () => {
    setLoading(true);
    const [promosRes, propertiesRes] = await Promise.all([
      fetch('/api/admin/data?type=promos'),
      fetch('/api/admin/data?type=properties')
    ]);
    const promosData = await promosRes.json();
    const propertiesData = await propertiesRes.json();
    setPromos(promosData || []);
    setProperties(propertiesData || []);
    setLoading(false);
  };
  
  const saveToAPI = async (data: any) => await fetch('/api/admin/data?type=promos', { 
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) 
  });
  
  const handleEdit = (p: any) => { 
    setEditingPromo(p); 
    setForm({ 
      id: p.id, titleId: p.titleId, titleEn: p.titleEn, 
      descriptionId: p.descriptionId, descriptionEn: p.descriptionEn, 
      image: p.image, validUntil: p.validUntil, active: p.active,
      propertyIds: p.propertyIds || [] 
    }); 
  };
  
  const handleSaveEdit = async () => { 
    const updated = promos.map(p => p.id === editingPromo.id ? form : p); 
    setPromos(updated); 
    await saveToAPI(updated); 
    await loadData();
    setEditingPromo(null); 
  };
  
  const handleAdd = () => { 
    setForm({ 
      id: `promo-${Date.now()}`, titleId: '', titleEn: '', 
      descriptionId: '', descriptionEn: '', image: '', validUntil: '', 
      active: true, propertyIds: [] 
    }); 
    setShowAddModal(true); 
  };
  
  const handleSaveAdd = async () => { 
    const newPromos = [...promos, form]; 
    setPromos(newPromos); 
    await saveToAPI(newPromos); 
    await loadData();
    setShowAddModal(false); 
  };
  
  const handleDelete = async (id: string) => { 
    if (confirm('Hapus promo ini?')) { 
      const filtered = promos.filter(p => p.id !== id); 
      setPromos(filtered); 
      await saveToAPI(filtered); 
      await loadData();
    } 
  };

  const handlePropertyToggle = (propertyId: string) => {
    setForm(prev => ({
      ...prev,
      propertyIds: prev.propertyIds.includes(propertyId)
        ? prev.propertyIds.filter(id => id !== propertyId)
        : [...prev.propertyIds, propertyId]
    }));
  };

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading...</div>;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage Promos</h2>
        <button onClick={handleAdd} className="bg-brand-green text-white px-4 py-2 rounded-lg">+ Tambah</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Title (ID)</th>
              <th className="px-4 py-3 text-left">Valid Until</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Properti</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{p.titleId}</td>
                <td className="px-4 py-3">{p.validUntil}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {p.propertyIds && p.propertyIds.length > 0 
                    ? `${p.propertyIds.length} properti` 
                    : 'Semua properti'}
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* ===== SEKARANG ModalForm sudah di luar, tidak dibuat ulang setiap render ===== */}
      {editingPromo && (
        <ModalForm 
          onSave={handleSaveEdit} 
          onClose={() => setEditingPromo(null)} 
          title="Edit Promo"
          form={form}
          setForm={setForm}
          properties={properties}
          handlePropertyToggle={handlePropertyToggle}
        />
      )}
      {showAddModal && (
        <ModalForm 
          onSave={handleSaveAdd} 
          onClose={() => setShowAddModal(false)} 
          title="Tambah Promo"
          form={form}
          setForm={setForm}
          properties={properties}
          handlePropertyToggle={handlePropertyToggle}
        />
      )}
    </div>
  );
}