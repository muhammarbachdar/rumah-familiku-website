'use client';

import { useState, useEffect } from 'react';

export default function ManageHomeSection() {
  const [home, setHome] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Modal states
  const [editingPropertyType, setEditingPropertyType] = useState<any>(null);
  const [editingWhyUs, setEditingWhyUs] = useState<any>(null);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [showAddPropertyType, setShowAddPropertyType] = useState(false);
  const [showAddWhyUs, setShowAddWhyUs] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data?type=home');
      const data = await res.json();
      setHome(data || {
        hero: { titleId: '', titleEn: '', subtitleId: '', subtitleEn: '', ctaPrimaryId: '', ctaPrimaryEn: '', ctaSecondaryId: '', ctaSecondaryEn: '', image: '' },
        propertyTypes: [],
        whyUs: [],
        reviews: []
      });
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveToAPI = async (newHome: any) => {
    await fetch('/api/admin/data?type=home', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHome),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleHeroSave = async () => {
    await saveToAPI(home);
  };

  // ===== Property Types CRUD =====
  const handleEditPropertyType = (idx: number, item: any) => {
    setEditingPropertyType({ idx, ...item });
    setForm({ ...item });
  };
  const handleSavePropertyType = async () => {
    const newTypes = [...home.propertyTypes];
    newTypes[editingPropertyType.idx] = form;
    const newHome = { ...home, propertyTypes: newTypes };
    setHome(newHome);
    await saveToAPI(newHome);
    setEditingPropertyType(null);
  };
  const handleAddPropertyType = () => {
    setForm({ icon: '', labelId: '', labelEn: '' });
    setShowAddPropertyType(true);
  };
  const handleSaveAddPropertyType = async () => {
    const newTypes = [...home.propertyTypes, form];
    const newHome = { ...home, propertyTypes: newTypes };
    setHome(newHome);
    await saveToAPI(newHome);
    setShowAddPropertyType(false);
  };
  const handleDeletePropertyType = async (idx: number) => {
    if (confirm('Hapus tipe properti ini?')) {
      const newTypes = home.propertyTypes.filter((_: any, i: number) => i !== idx);
      const newHome = { ...home, propertyTypes: newTypes };
      setHome(newHome);
      await saveToAPI(newHome);
    }
  };

  // ===== Why Us CRUD =====
  const handleEditWhyUs = (idx: number, item: any) => {
    setEditingWhyUs({ idx, ...item });
    setForm({ ...item });
  };
  const handleSaveWhyUs = async () => {
    const newItems = [...home.whyUs];
    newItems[editingWhyUs.idx] = form;
    const newHome = { ...home, whyUs: newItems };
    setHome(newHome);
    await saveToAPI(newHome);
    setEditingWhyUs(null);
  };
  const handleAddWhyUs = () => {
    setForm({ icon: '', titleId: '', titleEn: '', descId: '', descEn: '' });
    setShowAddWhyUs(true);
  };
  const handleSaveAddWhyUs = async () => {
    const newItems = [...home.whyUs, form];
    const newHome = { ...home, whyUs: newItems };
    setHome(newHome);
    await saveToAPI(newHome);
    setShowAddWhyUs(false);
  };
  const handleDeleteWhyUs = async (idx: number) => {
    if (confirm('Hapus item Why Us?')) {
      const newItems = home.whyUs.filter((_: any, i: number) => i !== idx);
      const newHome = { ...home, whyUs: newItems };
      setHome(newHome);
      await saveToAPI(newHome);
    }
  };

  // ===== Reviews CRUD =====
  const handleEditReview = (idx: number, item: any) => {
    setEditingReview({ idx, ...item });
    setForm({ ...item });
  };
  const handleSaveReview = async () => {
    const newReviews = [...home.reviews];
    newReviews[editingReview.idx] = form;
    const newHome = { ...home, reviews: newReviews };
    setHome(newHome);
    await saveToAPI(newHome);
    setEditingReview(null);
  };
  const handleAddReview = () => {
    setForm({ name: '', rating: 5, textId: '', textEn: '' });
    setShowAddReview(true);
  };
  const handleSaveAddReview = async () => {
    const newReviews = [...home.reviews, form];
    const newHome = { ...home, reviews: newReviews };
    setHome(newHome);
    await saveToAPI(newHome);
    setShowAddReview(false);
  };
  const handleDeleteReview = async (idx: number) => {
    if (confirm('Hapus review ini?')) {
      const newReviews = home.reviews.filter((_: any, i: number) => i !== idx);
      const newHome = { ...home, reviews: newReviews };
      setHome(newHome);
      await saveToAPI(newHome);
    }
  };

  // Modal component (reusable)
  const Modal = ({ title, onSave, onClose, children }: any) => (
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

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading home content...</div>;
  if (!home) return <div className="bg-white rounded-lg shadow p-6">No data</div>;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Hero Section</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium">Title (ID)</label><input type="text" value={home.hero.titleId} onChange={e => setHome({...home, hero: {...home.hero, titleId: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">Title (EN)</label><input type="text" value={home.hero.titleEn} onChange={e => setHome({...home, hero: {...home.hero, titleEn: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">Subtitle (ID)</label><input type="text" value={home.hero.subtitleId} onChange={e => setHome({...home, hero: {...home.hero, subtitleId: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">Subtitle (EN)</label><input type="text" value={home.hero.subtitleEn} onChange={e => setHome({...home, hero: {...home.hero, subtitleEn: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">CTA Primary (ID)</label><input type="text" value={home.hero.ctaPrimaryId} onChange={e => setHome({...home, hero: {...home.hero, ctaPrimaryId: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">CTA Primary (EN)</label><input type="text" value={home.hero.ctaPrimaryEn} onChange={e => setHome({...home, hero: {...home.hero, ctaPrimaryEn: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">CTA Secondary (ID)</label><input type="text" value={home.hero.ctaSecondaryId} onChange={e => setHome({...home, hero: {...home.hero, ctaSecondaryId: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium">CTA Secondary (EN)</label><input type="text" value={home.hero.ctaSecondaryEn} onChange={e => setHome({...home, hero: {...home.hero, ctaSecondaryEn: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
          <div className="col-span-2"><label className="block text-sm font-medium">Hero Image URL</label><input type="text" value={home.hero.image} onChange={e => setHome({...home, hero: {...home.hero, image: e.target.value}})} className="w-full border rounded-lg px-3 py-2" /></div>
        </div>
        <button onClick={handleHeroSave} className="mt-4 bg-brand-green text-white px-4 py-2 rounded-lg">{saved ? '✓ Tersimpan!' : 'Simpan Hero'}</button>
      </div>

      {/* Property Types */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Property Types</h3><button onClick={handleAddPropertyType} className="bg-brand-green text-white px-3 py-1 rounded text-sm">+ Tambah</button></div>
        <div className="space-y-2">
          {home.propertyTypes.map((item: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-3 flex justify-between items-center">
              <div><span className="font-mono">{item.icon}</span> — <span>{item.labelId} / {item.labelEn}</span></div>
              <div><button onClick={() => handleEditPropertyType(idx, item)} className="text-blue-600 mr-2">Edit</button><button onClick={() => handleDeletePropertyType(idx)} className="text-red-600">Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Us */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Why Us</h3><button onClick={handleAddWhyUs} className="bg-brand-green text-white px-3 py-1 rounded text-sm">+ Tambah</button></div>
        <div className="space-y-2">
          {home.whyUs.map((item: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-3 flex justify-between items-center">
              <div><span className="text-2xl">{item.icon}</span> — <span>{item.titleId} / {item.titleEn}</span></div>
              <div><button onClick={() => handleEditWhyUs(idx, item)} className="text-blue-600 mr-2">Edit</button><button onClick={() => handleDeleteWhyUs(idx)} className="text-red-600">Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Reviews</h3><button onClick={handleAddReview} className="bg-brand-green text-white px-3 py-1 rounded text-sm">+ Tambah</button></div>
        <div className="space-y-2">
          {home.reviews.map((item: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-3 flex justify-between items-center">
              <div><span className="font-bold">{item.name}</span> (⭐{item.rating}) — {item.textId.substring(0, 50)}...</div>
              <div><button onClick={() => handleEditReview(idx, item)} className="text-blue-600 mr-2">Edit</button><button onClick={() => handleDeleteReview(idx)} className="text-red-600">Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {editingPropertyType && (
        <Modal title="Edit Property Type" onSave={handleSavePropertyType} onClose={() => setEditingPropertyType(null)}>
          <div className="space-y-3"><input placeholder="Icon URL/Emoji" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Label ID" value={form.labelId} onChange={e => setForm({...form, labelId: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Label EN" value={form.labelEn} onChange={e => setForm({...form, labelEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
      {showAddPropertyType && (
        <Modal title="Tambah Property Type" onSave={handleSaveAddPropertyType} onClose={() => setShowAddPropertyType(false)}>
          <div className="space-y-3"><input placeholder="Icon URL/Emoji" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Label ID" value={form.labelId} onChange={e => setForm({...form, labelId: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Label EN" value={form.labelEn} onChange={e => setForm({...form, labelEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
      {editingWhyUs && (
        <Modal title="Edit Why Us" onSave={handleSaveWhyUs} onClose={() => setEditingWhyUs(null)}>
          <div className="space-y-3"><input placeholder="Icon" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title ID" value={form.titleId} onChange={e => setForm({...form, titleId: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title EN" value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc ID" rows={2} value={form.descId} onChange={e => setForm({...form, descId: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc EN" rows={2} value={form.descEn} onChange={e => setForm({...form, descEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
      {showAddWhyUs && (
        <Modal title="Tambah Why Us" onSave={handleSaveAddWhyUs} onClose={() => setShowAddWhyUs(false)}>
          <div className="space-y-3"><input placeholder="Icon" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title ID" value={form.titleId} onChange={e => setForm({...form, titleId: e.target.value})} className="w-full border rounded px-3 py-2" /><input placeholder="Title EN" value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc ID" rows={2} value={form.descId} onChange={e => setForm({...form, descId: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Desc EN" rows={2} value={form.descEn} onChange={e => setForm({...form, descEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
      {editingReview && (
        <Modal title="Edit Review" onSave={handleSaveReview} onClose={() => setEditingReview(null)}>
          <div className="space-y-3"><input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" /><input type="number" placeholder="Rating (1-5)" value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Text ID" rows={2} value={form.textId} onChange={e => setForm({...form, textId: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Text EN" rows={2} value={form.textEn} onChange={e => setForm({...form, textEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
      {showAddReview && (
        <Modal title="Tambah Review" onSave={handleSaveAddReview} onClose={() => setShowAddReview(false)}>
          <div className="space-y-3"><input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" /><input type="number" placeholder="Rating (1-5)" value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Text ID" rows={2} value={form.textId} onChange={e => setForm({...form, textId: e.target.value})} className="w-full border rounded px-3 py-2" /><textarea placeholder="Text EN" rows={2} value={form.textEn} onChange={e => setForm({...form, textEn: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
        </Modal>
      )}
    </div>
  );
}