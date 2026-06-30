'use client';

import { useState, useEffect } from 'react';

// Modal component (dipindahkan ke luar agar tidak remount tiap render)
function Modal({ title, onSave, onClose, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
        <div className="flex gap-3 mt-6">
          <button onClick={onSave} className="flex-1 bg-brand-green text-white py-2 rounded-lg">Simpan</button>
          <button onClick={onClose} className="flex-1 border py-2 rounded-lg">Batal</button>
        </div>
      </div>
    </div>
  );
}

export default function ManageAboutSection() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [editingValue, setEditingValue] = useState<any>(null);
  const [editingWhy, setEditingWhy] = useState<any>(null);
  const [showAddWhy, setShowAddWhy] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data?type=about');
      const data = await res.json();
      setContent(data || {
        mission: '', missionEn: '',
        ctaTitle: '', ctaTitleEn: '',
        ctaDesc: '', ctaDescEn: '',
        values: [],
        whyChooseUs: []
      });
    } catch (error) {
      console.error('Failed to load about data:', error);
    } finally {
      setLoading(false);
    }
  };
  const saveToAPI = async (newContent: any) => {
    await fetch('/api/admin/data?type=about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContent),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveMain = async () => {
    await saveToAPI(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ===== Values CRUD (sama seperti sebelumnya) =====
  const handleEditValue = (idx: number, item: any) => {
    setEditingValue({ idx, ...item });
    setForm({ ...item });
  };
  const handleSaveValue = async () => {
    if (!editingValue) return;
    const newValues = [...content.values];
    newValues[editingValue.idx] = {
      title: editingValue.title, desc: editingValue.desc,
      titleEn: editingValue.titleEn, descEn: editingValue.descEn
    };
    const newContent = { ...content, values: newValues };
    setContent(newContent);
    await saveToAPI(newContent);
    setEditingValue(null);
  };
  const handleAddValue = () => {
    setForm({ title: '', desc: '', titleEn: '', descEn: '' });
    setEditingValue({ idx: -1 });
  };
  const handleSaveAddValue = async () => {
    const newValues = [...content.values, form];
    const newContent = { ...content, values: newValues };
    setContent(newContent);
    await saveToAPI(newContent);
    setEditingValue(null);
  };
  const handleDeleteValue = async (idx: number) => {
    if (confirm('Hapus nilai ini?')) {
      const newValues = content.values.filter((_: any, i: number) => i !== idx);
      const newContent = { ...content, values: newValues };
      setContent(newContent);
      await saveToAPI(newContent);
    }
  };

  // ===== Why Choose Us CRUD =====
  const handleEditWhy = (idx: number, item: any) => {
    setEditingWhy({ idx, ...item });
    setForm({ ...item });
  };
  const handleSaveWhy = async () => {
    if (!editingWhy) return;
    const newWhy = [...content.whyChooseUs];
    newWhy[editingWhy.idx] = {
      icon: editingWhy.icon,
      titleId: editingWhy.titleId, titleEn: editingWhy.titleEn,
      descId: editingWhy.descId, descEn: editingWhy.descEn
    };
    const newContent = { ...content, whyChooseUs: newWhy };
    setContent(newContent);
    await saveToAPI(newContent);
    setEditingWhy(null);
  };
  const handleAddWhy = () => {
    setForm({ icon: '', titleId: '', titleEn: '', descId: '', descEn: '' });
    setShowAddWhy(true);
  };
  const handleSaveAddWhy = async () => {
    const newWhy = [...(content.whyChooseUs || []), form];
    const newContent = { ...content, whyChooseUs: newWhy };
    setContent(newContent);
    await saveToAPI(newContent);
    setShowAddWhy(false);
  };
  const handleDeleteWhy = async (idx: number) => {
    if (confirm('Hapus item ini?')) {
      const newWhy = content.whyChooseUs.filter((_: any, i: number) => i !== idx);
      const newContent = { ...content, whyChooseUs: newWhy };
      setContent(newContent);
      await saveToAPI(newContent);
    }
  };

  

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading About data...</div>;
  if (!content) return <div className="bg-white rounded-lg shadow p-6">No data</div>;

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Manage About</h2>
        <div className="space-y-4">
          <textarea placeholder="Misi ID" rows={3} value={content.mission} onChange={e => setContent({...content, mission: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          <textarea placeholder="Misi EN" rows={3} value={content.missionEn} onChange={e => setContent({...content, missionEn: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          <input placeholder="CTA Judul ID" value={content.ctaTitle} onChange={e => setContent({...content, ctaTitle: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          <input placeholder="CTA Judul EN" value={content.ctaTitleEn} onChange={e => setContent({...content, ctaTitleEn: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          <textarea placeholder="CTA Deskripsi ID" rows={2} value={content.ctaDesc} onChange={e => setContent({...content, ctaDesc: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          <textarea placeholder="CTA Deskripsi EN" rows={2} value={content.ctaDescEn} onChange={e => setContent({...content, ctaDescEn: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          <button onClick={handleSaveMain} className="bg-brand-green text-white px-6 py-2 rounded-lg">{saved ? '✓ Tersimpan!' : 'Simpan'}</button>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Nilai-Nilai Kami</h3><button onClick={handleAddValue} className="bg-brand-green text-white px-3 py-1 rounded text-sm">+ Tambah</button></div>
        <div className="space-y-3">
          {content.values.map((v: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4 flex justify-between">
              <div><p className="font-bold">{v.title}</p><p className="text-sm">{v.desc}</p><p className="text-xs text-gray-400">EN: {v.titleEn} - {v.descEn}</p></div>
              <div><button onClick={() => handleEditValue(idx, v)} className="text-blue-600 mr-2">Edit</button><button onClick={() => handleDeleteValue(idx)} className="text-red-600">Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Why Choose Us</h3><button onClick={handleAddWhy} className="bg-brand-green text-white px-3 py-1 rounded text-sm">+ Tambah</button></div>
        <div className="space-y-3">
          {(content.whyChooseUs || []).map((item: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4 flex justify-between">
              <div><span className="text-2xl mr-2">{item.icon}</span><span className="font-bold">{item.titleId}</span><p className="text-sm">{item.descId}</p><p className="text-xs text-gray-400">EN: {item.titleEn} - {item.descEn}</p></div>
              <div><button onClick={() => handleEditWhy(idx, item)} className="text-blue-600 mr-2">Edit</button><button onClick={() => handleDeleteWhy(idx)} className="text-red-600">Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Value Modal */}
      {editingValue && editingValue.idx !== -1 && (
        <Modal title="Edit Nilai" onSave={handleSaveValue} onClose={() => setEditingValue(null)}>
          <div className="space-y-3"><input placeholder="Judul ID" value={editingValue.title} onChange={e => setEditingValue({...editingValue, title: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Deskripsi ID" rows={2} value={editingValue.desc} onChange={e => setEditingValue({...editingValue, desc: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Judul EN" value={editingValue.titleEn} onChange={e => setEditingValue({...editingValue, titleEn: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Deskripsi EN" rows={2} value={editingValue.descEn} onChange={e => setEditingValue({...editingValue, descEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
      {editingValue && editingValue.idx === -1 && (
        <Modal title="Tambah Nilai" onSave={handleSaveAddValue} onClose={() => setEditingValue(null)}>
          <div className="space-y-3"><input placeholder="Judul ID" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Deskripsi ID" rows={2} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Judul EN" value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Deskripsi EN" rows={2} value={form.descEn} onChange={e => setForm({...form, descEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}

      {/* Edit Why Choose Us Modal */}
      {editingWhy && (
        <Modal title="Edit Why Choose Us" onSave={handleSaveWhy} onClose={() => setEditingWhy(null)}>
          <div className="space-y-3"><input placeholder="Icon (emoji)" value={editingWhy.icon} onChange={e => setEditingWhy({...editingWhy, icon: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title ID" value={editingWhy.titleId} onChange={e => setEditingWhy({...editingWhy, titleId: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title EN" value={editingWhy.titleEn} onChange={e => setEditingWhy({...editingWhy, titleEn: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc ID" rows={2} value={editingWhy.descId} onChange={e => setEditingWhy({...editingWhy, descId: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc EN" rows={2} value={editingWhy.descEn} onChange={e => setEditingWhy({...editingWhy, descEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
      {showAddWhy && (
        <Modal title="Tambah Why Choose Us" onSave={handleSaveAddWhy} onClose={() => setShowAddWhy(false)}>
          <div className="space-y-3"><input placeholder="Icon (emoji)" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title ID" value={form.titleId} onChange={e => setForm({...form, titleId: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title EN" value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc ID" rows={2} value={form.descId} onChange={e => setForm({...form, descId: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc EN" rows={2} value={form.descEn} onChange={e => setForm({...form, descEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
    </div>
  );
}