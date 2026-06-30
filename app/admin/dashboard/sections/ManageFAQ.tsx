'use client';

import { useState, useEffect } from 'react';

// ==================== ModalForm Component (dipindahkan ke luar) ====================
interface ModalFormProps {
  form: {
    id: string;
    categoryId: string;
    categoryEn: string;
    questionId: string;
    questionEn: string;
    answerIdContent: string;
    answerEnContent: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => void;
  onClose: () => void;
  title: string;
}

function ModalForm({ form, setForm, onSave, onClose, title }: ModalFormProps) {
  // Mapping kategori ID ke EN
  const categoryMapping: Record<string, string> = {
    'Umum': 'General',
    'Booking': 'Booking',
    'Pembayaran': 'Payment',
    'Peraturan': 'Rules'
  };

  // Pilihan dropdown untuk kategori EN
  const categoryEnOptions = [
    { value: 'General', label: 'General' },
    { value: 'Booking', label: 'Booking' },
    { value: 'Payment', label: 'Payment' },
    { value: 'Rules', label: 'Rules' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-charcoal mb-4">{title}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (ID)</label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const newCategoryId = e.target.value;
                  const newCategoryEn = categoryMapping[newCategoryId] || '';
                  setForm({ ...form, categoryId: newCategoryId, categoryEn: newCategoryEn });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="">Pilih Kategori</option>
                <option value="Umum">Umum</option>
                <option value="Booking">Booking</option>
                <option value="Pembayaran">Pembayaran</option>
                <option value="Peraturan">Peraturan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (EN)</label>
              <select
                value={form.categoryEn}
                onChange={(e) => setForm({ ...form, categoryEn: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="">Pilih Kategori EN</option>
                {categoryEnOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan (ID)</label>
            <input
              type="text"
              value={form.questionId}
              onChange={(e) => setForm({ ...form, questionId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan (EN)</label>
            <input
              type="text"
              value={form.questionEn}
              onChange={(e) => setForm({ ...form, questionEn: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban (ID)</label>
            <textarea
              value={form.answerIdContent}
              onChange={(e) => setForm({ ...form, answerIdContent: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban (EN)</label>
            <textarea
              value={form.answerEnContent}
              onChange={(e) => setForm({ ...form, answerEnContent: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onSave} className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-hover transition font-medium">Simpan</button>
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition">Batal</button>
        </div>
      </div>
    </div>
  );
}

// ==================== Komponen Utama ManageFAQSection ====================
export default function ManageFAQSection() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    id: '',
    categoryId: '',
    categoryEn: '',
    questionId: '',
    questionEn: '',
    answerIdContent: '',
    answerEnContent: '',
  });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data?type=faqs');
      const data = await res.json();
      setFaqs(data || []);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToAPI = async (newFaqs: any[]) => {
    await fetch('/api/admin/data?type=faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFaqs),
    });
  };

  const handleEdit = (faq: any) => {
    setEditingFaq(faq);
    setForm({ ...faq });
  };

  const handleSaveEdit = async () => {
    const updated = faqs.map(f => f.id === editingFaq.id ? form : f);
    setFaqs(updated);
    await saveToAPI(updated);
    await loadData();
    setEditingFaq(null);
  };

  const handleAdd = () => {
    setForm({
      id: `faq-${Date.now()}`,
      categoryId: '',
      categoryEn: '',
      questionId: '',
      questionEn: '',
      answerIdContent: '',
      answerEnContent: '',
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = async () => {
    const newFaqs = [...faqs, form];
    setFaqs(newFaqs);
    await saveToAPI(newFaqs);
    await loadData();
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus FAQ ini?')) {
      const filtered = faqs.filter(f => f.id !== id);
      setFaqs(filtered);
      await saveToAPI(filtered);
      await loadData();
    }
  };

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading FAQs...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-charcoal">Manage FAQ</h2>
        <button onClick={handleAdd} className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-green-hover transition font-medium">+ Tambah FAQ</button>
      </div>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold text-brand-green bg-green-50 px-2 py-1 rounded-full">{faq.categoryId}</span>
              <p className="font-medium text-charcoal mt-2">{faq.questionId}</p>
              <p className="text-sm text-gray-text mt-1 line-clamp-2">{faq.answerIdContent}</p>
              <p className="text-xs text-gray-400 mt-1">EN: {faq.questionEn}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(faq)} className="text-blue-600 hover:underline text-sm">Edit</button>
              <button onClick={() => handleDelete(faq.id)} className="text-red-600 hover:underline text-sm">Hapus</button>
            </div>
          </div>
        ))}
      </div>
      {editingFaq && (
        <ModalForm
          form={form}
          setForm={setForm}
          onSave={handleSaveEdit}
          onClose={() => setEditingFaq(null)}
          title="Edit FAQ"
        />
      )}
      {showAddModal && (
        <ModalForm
          form={form}
          setForm={setForm}
          onSave={handleSaveAdd}
          onClose={() => setShowAddModal(false)}
          title="Tambah FAQ Baru"
        />
      )}
    </div>
  );
}