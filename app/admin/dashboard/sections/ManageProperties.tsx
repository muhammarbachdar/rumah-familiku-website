'use client';

import { useState, useEffect } from 'react';
import { addUnit, deleteUnit, fetchProperties } from '@/lib/api';
import { toast } from 'sonner';
import { extractMapsEmbedUrl } from '@/lib/maps';
import { FACILITY_OPTIONS } from '@/lib/constants/facilities';

// ===== ModalForm Props Interface =====
interface ModalFormProps {
  title: string;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => Promise<void>;
  onClose: () => void;
  isAdd?: boolean;
  typeBadge: Record<string, string>;
  typeDisplay: Record<string, string>;
  // Unit states
  newUnitName: string;
  setNewUnitName: React.Dispatch<React.SetStateAction<string>>;
  isUnitSubmitting: boolean;
  setIsUnitSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  unitMessage: { type: 'success' | 'error'; text: string } | null;
  setUnitMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error'; text: string } | null>>;
  handleAddUnit: () => Promise<void>;
  handleDeleteUnit: (unitId: string, unitName: string) => Promise<void>;
  // RoomType states
  roomTypeForm: any;
  setRoomTypeForm: React.Dispatch<React.SetStateAction<any>>;
  roomForm: { roomNumber: string };
  setRoomForm: React.Dispatch<React.SetStateAction<{ roomNumber: string }>>;
  editingRoomTypeIndex: number | null;
  setEditingRoomTypeIndex: React.Dispatch<React.SetStateAction<number | null>>;
  showAddRoomType: boolean;
  setShowAddRoomType: React.Dispatch<React.SetStateAction<boolean>>;
  showAddRoom: number | null;
  setShowAddRoom: React.Dispatch<React.SetStateAction<number | null>>;
  handleAddRoomType: () => void;
  handleSaveRoomType: () => void;
  handleEditRoomType: (idx: number) => void;
  handleUpdateRoomType: () => void;
  handleDeleteRoomType: (idx: number) => void;
  handleAddRoom: (roomTypeIdx: number) => void;
  handleSaveRoom: () => void;
  handleDeleteRoom: (roomTypeIdx: number, roomIdx: number) => void;
}

export default function ManagePropertiesSection() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    nameId: '', nameEn: '', type: '', locationId: '', locationEn: '', mapsUrl: '',
    capacityMin: 0, capacityMax: 0, description: '', descriptionEn: '',
    image: '', images: [] as string[], imagesCategorized: [] as { url: string; category: string }[],
    facilities: [] as { label: string; labelEn: string; icon: string }[],
    pricingWeekday: 0, pricingWeekend: 0,
    monthlyPricingWNI: 0, monthlyPricingWNA: 0,
    rules: [] as string[], rulesEn: [] as string[],
    roomTypes: [] as any[],
    units: [] as any[],
  });

  // Unit management states (untuk Kos)
  const [newUnitName, setNewUnitName] = useState('');
  const [isUnitSubmitting, setIsUnitSubmitting] = useState(false);
  const [unitMessage, setUnitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Room Type management states (untuk Hotel)
  const [editingRoomTypeIndex, setEditingRoomTypeIndex] = useState<number | null>(null);
  const [editingRoomIndex, setEditingRoomIndex] = useState<{ roomTypeIdx: number; roomIdx: number } | null>(null);
  const [showAddRoomType, setShowAddRoomType] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState<number | null>(null);
  const [roomTypeForm, setRoomTypeForm] = useState({
    nameId: '', nameEn: '', capacity: 2, priceWeekday: 0, priceWeekend: 0, images: [] as string[],
    rooms: [] as { roomNumber: string }[],
  });
  const [roomForm, setRoomForm] = useState({ roomNumber: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { const res = await fetch('/api/admin/data?type=properties'); const data = await res.json(); setProperties(data || []); setLoading(false); };
  const saveToAPI = async (data: any) => {
    const res = await fetch('/api/admin/data?type=properties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan properti');
    }
    return res;
  };

  // Reset hotel states
  const resetHotelStates = () => {
    setEditingRoomTypeIndex(null);
    setShowAddRoomType(false);
    setShowAddRoom(null);
    setRoomTypeForm({ nameId: '', nameEn: '', capacity: 2, priceWeekday: 0, priceWeekend: 0, images: [], rooms: [] });
    setRoomForm({ roomNumber: '' });
    setEditingRoomIndex(null);
  };

  // ==================== Edit ====================
  const handleEdit = (p: any) => {
    resetHotelStates();
    setEditingProperty(p);
    setForm({
      nameId: p.nameId, nameEn: p.nameEn, type: p.type,
      locationId: p.locationId, locationEn: p.locationEn, mapsUrl: p.mapsUrl || '',
      capacityMin: p.capacity.min, capacityMax: p.capacity.max,
      description: p.description, descriptionEn: p.descriptionEn,
      image: p.image || '', images: p.images || [], imagesCategorized: p.imagesCategorized || [],
      facilities: p.facilities || [],
      pricingWeekday: p.pricing?.weekday || 0,
      pricingWeekend: p.pricing?.weekend || 0,
      monthlyPricingWNI: p.monthlyPricingWNI || 0,
      monthlyPricingWNA: p.monthlyPricingWNA || 0,
      rules: p.rules || [],
      rulesEn: p.rulesEn || [],
      roomTypes: p.roomTypes || [],
      units: p.units || [],
    });
    setUnitMessage(null);
    setNewUnitName('');
  };

  const handleSave = async () => {
    const previousProperties = [...properties];
    const updated = properties.map(p => p.id === editingProperty.id
      ? {
          ...p,
          nameId: form.nameId, nameEn: form.nameEn, type: form.type,
          locationId: form.locationId, locationEn: form.locationEn, mapsUrl: form.mapsUrl,
          capacity: { min: form.capacityMin, max: form.capacityMax },
          description: form.description, descriptionEn: form.descriptionEn,
          image: form.image, images: form.images, imagesCategorized: form.imagesCategorized, facilities: form.facilities,
          pricing: form.type !== 'kos' ? { weekday: form.pricingWeekday, weekend: form.pricingWeekend } : undefined,
          monthlyPricingWNI: form.type === 'kos' ? form.monthlyPricingWNI : undefined,
          monthlyPricingWNA: form.type === 'kos' ? form.monthlyPricingWNA : undefined,
          rules: form.rules, rulesEn: form.rulesEn,
          roomTypes: form.type === 'hotel' ? form.roomTypes : undefined,
          units: form.type !== 'hotel' ? form.units : undefined,
        }
      : p
    );
    setProperties(updated);
    try {
      await saveToAPI(updated);
      await loadData();
      setEditingProperty(null);
      resetHotelStates();
      toast.success('Properti berhasil disimpan!');
    } catch (error) {
      setProperties(previousProperties);
      toast.error('Gagal menyimpan properti. Silakan coba lagi.');
      console.error('Save failed:', error);
    }
  };

  // ==================== Tambah Properti ====================
  const handleAdd = () => {
    resetHotelStates();
    setForm({
      nameId: '', nameEn: '', type: 'hotel', locationId: '', locationEn: '', mapsUrl: '',
      capacityMin: 1, capacityMax: 1, description: '', descriptionEn: '',
      image: '', images: [], imagesCategorized: [], facilities: [],
      pricingWeekday: 0, pricingWeekend: 0,
      monthlyPricingWNI: 0, monthlyPricingWNA: 0,
      rules: [], rulesEn: [],
      roomTypes: [],
      units: [],
    });
    setNewUnitName('');
    setUnitMessage(null);
    setShowAddModal(true);
  };
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };
  const handleSaveAdd = async () => {
    const slug = generateSlug(form.nameId);
    const newProperty: any = {
      id: `prop-${Date.now()}`,
      slug,
      nameId: form.nameId, nameEn: form.nameEn, type: form.type,
      locationId: form.locationId, locationEn: form.locationEn, mapsUrl: form.mapsUrl,
      capacity: { min: form.capacityMin, max: form.capacityMax },
      description: form.description, descriptionEn: form.descriptionEn,
      image: form.image, images: form.images, imagesCategorized: form.imagesCategorized, facilities: form.facilities,
      rules: form.rules, rulesEn: form.rulesEn,
      roomTypes: form.type === 'hotel' ? form.roomTypes : undefined,
      units: form.type !== 'hotel' ? form.units : undefined,
    };
    if (form.type !== 'kos') {
      newProperty.pricing = { weekday: form.pricingWeekday, weekend: form.pricingWeekend };
    } else {
      newProperty.monthlyPricingWNI = form.monthlyPricingWNI;
      newProperty.monthlyPricingWNA = form.monthlyPricingWNA;
    }
    const newProperties = [...properties, newProperty];
    setProperties(newProperties);
    try {
      await saveToAPI(newProperties);
      toast.success('Properti berhasil ditambahkan!');
      setShowAddModal(false);
      resetHotelStates();
    } catch (error) {
      toast.error('Gagal menambahkan properti. Silakan coba lagi.');
      console.error('Add failed:', error);
    }
  };

  // ==================== Hapus Properti ====================
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus properti "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      // ===== SIMPAN STATE SEBELUMNYA UNTUK ROLLBACK =====
      const previousProperties = [...properties];
      
      // ===== OPTIMISTIC UPDATE =====
      setProperties(prev => prev.filter(p => p.id !== id));
      
      try {
        const res = await fetch('/api/admin/data?type=properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deleteProperty', id }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal menghapus properti');
        }

        toast.success('Properti berhasil dihapus!');
      } catch (error: any) {
        // ===== ROLLBACK JIKA GAGAL =====
        setProperties(previousProperties);
        toast.error(error.message || 'Gagal menghapus properti. Silakan coba lagi.');
        console.error('Delete failed:', error);
      }
    }
  };

  // ==================== Unit Management (Kos) ====================
  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      setUnitMessage({ type: 'error', text: 'Masukkan nama kamar.' });
      return;
    }

    if (!editingProperty) {
      const newUnit = { unitId: `unit-${Date.now()}`, unitName: newUnitName.trim() };
      setForm(prev => ({ ...prev, units: [...(prev.units || []), newUnit] }));
      setNewUnitName('');
      setUnitMessage({ type: 'success', text: 'Kamar ditambahkan (akan tersimpan saat properti dibuat).' });
      return;
    }

    setIsUnitSubmitting(true);
    setUnitMessage(null);

    try {
      await addUnit(editingProperty.id, newUnitName.trim());

      const refreshed = await fetchProperties();
      const updatedProperty = refreshed.find((p: any) => p.id === editingProperty.id);
      if (updatedProperty) {
        setEditingProperty(updatedProperty);
        setProperties(refreshed);
        setForm(prev => ({ ...prev, units: updatedProperty.units || [] }));
      }

      setNewUnitName('');
      setUnitMessage({ type: 'success', text: 'Kamar berhasil ditambahkan!' });
      toast.success('Kamar berhasil ditambahkan!');
    } catch (err: any) {
      setUnitMessage({ type: 'error', text: err.message || 'Gagal menambahkan kamar.' });
      toast.error(err.message || 'Gagal menambahkan kamar.');
    } finally {
      setIsUnitSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: string, unitName: string) => {
    if (!confirm(`Hapus kamar "${unitName}"?`)) return;

    if (!editingProperty) {
      setForm(prev => ({ ...prev, units: prev.units.filter((u: any) => u.unitId !== unitId) }));
      setUnitMessage({ type: 'success', text: 'Kamar dihapus dari daftar.' });
      return;
    }

    setUnitMessage(null);

    try {
      await deleteUnit(editingProperty.id, unitId);

      const refreshed = await fetchProperties();
      const updatedProperty = refreshed.find((p: any) => p.id === editingProperty.id);
      if (updatedProperty) {
        setEditingProperty(updatedProperty);
        setProperties(refreshed);
        setForm(prev => ({ ...prev, units: updatedProperty.units || [] }));
      }

      setUnitMessage({ type: 'success', text: 'Kamar berhasil dihapus!' });
      toast.success('Kamar berhasil dihapus!');
    } catch (err: any) {
      setUnitMessage({ type: 'error', text: err.message || 'Gagal menghapus kamar.' });
      toast.error(err.message || 'Gagal menghapus kamar.');
    }
  };

  // ==================== Room Type Management (Hotel) ====================
  const handleAddRoomType = () => {
    setRoomTypeForm({
      nameId: '', nameEn: '', capacity: 2, priceWeekday: 0, priceWeekend: 0, images: [],
      rooms: [],
    });
    setShowAddRoomType(true);
  };

  const handleSaveRoomType = () => {
    if (!roomTypeForm.nameId.trim() || !roomTypeForm.nameEn.trim()) {
      toast.error('Nama tipe kamar (ID dan EN) wajib diisi.');
      return;
    }
    if (roomTypeForm.rooms.length === 0) {
      toast.error('Minimal 1 kamar wajib ditambahkan.');
      return;
    }

    const newRoomType = {
      id: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      nameId: roomTypeForm.nameId,
      nameEn: roomTypeForm.nameEn,
      capacity: roomTypeForm.capacity,
      priceWeekday: roomTypeForm.priceWeekday,
      priceWeekend: roomTypeForm.priceWeekend,
      images: roomTypeForm.images || '',
      rooms: roomTypeForm.rooms.map((r: { roomNumber: string }) => ({
        id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        roomNumber: r.roomNumber,
      })),
    };

    setForm(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, newRoomType],
    }));
    setShowAddRoomType(false);
    setRoomTypeForm({ nameId: '', nameEn: '', capacity: 2, priceWeekday: 0, priceWeekend: 0, images: [], rooms: [] });
    toast.success('Tipe kamar berhasil ditambahkan!');
  };

  const handleEditRoomType = (idx: number) => {
    const rt = form.roomTypes[idx];
    setRoomTypeForm({
      nameId: rt.nameId,
      nameEn: rt.nameEn,
      capacity: rt.capacity,
      priceWeekday: rt.priceWeekday,
      priceWeekend: rt.priceWeekend,
      images: rt.images || '',
      rooms: rt.rooms.map((r: any) => ({ roomNumber: r.roomNumber })),
    });
    setEditingRoomTypeIndex(idx);
  };

  const handleUpdateRoomType = () => {
    if (editingRoomTypeIndex === null) return;
    if (!roomTypeForm.nameId.trim() || !roomTypeForm.nameEn.trim()) {
      toast.error('Nama tipe kamar (ID dan EN) wajib diisi.');
      return;
    }

    const updated = [...form.roomTypes];
    updated[editingRoomTypeIndex] = {
      ...updated[editingRoomTypeIndex],
      nameId: roomTypeForm.nameId,
      nameEn: roomTypeForm.nameEn,
      capacity: roomTypeForm.capacity,
      priceWeekday: roomTypeForm.priceWeekday,
      priceWeekend: roomTypeForm.priceWeekend,
      images: roomTypeForm.images || '',
    };

    setForm(prev => ({ ...prev, roomTypes: updated }));
    setEditingRoomTypeIndex(null);
    setRoomTypeForm({ nameId: '', nameEn: '', capacity: 2, priceWeekday: 0, priceWeekend: 0, images: [], rooms: [] });
    toast.success('Tipe kamar berhasil diupdate!');
    
  };

  const handleDeleteRoomType = (idx: number) => {
    if (!confirm('Hapus tipe kamar ini? Semua kamar di dalamnya juga akan terhapus.')) return;
    const updated = form.roomTypes.filter((_: any, i: number) => i !== idx);
    setForm(prev => ({ ...prev, roomTypes: updated }));
    toast.success('Tipe kamar berhasil dihapus!');
  };

  const handleAddRoom = (roomTypeIdx: number) => {
    setRoomForm({ roomNumber: '' });
    setShowAddRoom(roomTypeIdx);
  };

  const handleSaveRoom = () => {
    if (showAddRoom === null) return;
    if (!roomForm.roomNumber.trim()) {
      toast.error('Nomor kamar wajib diisi.');
      return;
    }

    const updated = [...form.roomTypes];
    updated[showAddRoom].rooms.push({
      id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      roomNumber: roomForm.roomNumber.trim(),
    });

    setForm(prev => ({ ...prev, roomTypes: updated }));
    setShowAddRoom(null);
    setRoomForm({ roomNumber: '' });
    toast.success('Kamar berhasil ditambahkan!');
  };

  const handleDeleteRoom = (roomTypeIdx: number, roomIdx: number) => {
    if (!confirm('Hapus kamar ini?')) return;
    const updated = [...form.roomTypes];
    updated[roomTypeIdx].rooms = updated[roomTypeIdx].rooms.filter((_: any, i: number) => i !== roomIdx);
    setForm(prev => ({ ...prev, roomTypes: updated }));
    toast.success('Kamar berhasil dihapus!');
  };

  const typeBadge: Record<string, string> = {
    hotel: 'bg-blue-100 text-blue-700', kos: 'bg-yellow-100 text-yellow-700',
    apartemen: 'bg-purple-100 text-purple-700', rumah: 'bg-green-100 text-green-700'
  };
  const typeDisplay: Record<string, string> = {
    hotel: 'Hotel', kos: 'Kos', apartemen: 'Apartemen', rumah: 'Rumah/Villa'
  };

  if (loading) return <div className="bg-white rounded-lg shadow p-6">Loading properties...</div>;
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-0">Manage Properties</h2>
        <button onClick={handleAdd} className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-green-hover transition">+ Tambah Properti</button>
      </div>
      <div className="space-y-3">
        {properties.map(p => {
          const badgeClass = typeBadge[p.type] || 'bg-gray-100 text-gray-700';
          const displayType = typeDisplay[p.type] || p.type;
          return (
            <div key={p.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{displayType}</span>
                  <span className="font-bold">{p.nameId}</span>
                </div>
                <p className="text-sm text-gray-text mt-1">📍 {p.locationId}</p>
                <p className="text-sm">👥 {p.capacity.min}–{p.capacity.max} orang</p>
                <p className="text-sm line-clamp-1">{p.description}</p>
                {p.type === 'hotel' && p.roomTypes && p.roomTypes.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{p.roomTypes.length} tipe kamar</p>
                )}
                {(p.type === 'kos' || p.type === 'apartemen' || p.type === 'rumah') && p.units && p.units.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{p.units.length} unit</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(p.id, p.nameId)} className="text-red-600 hover:underline">Hapus</button>
              </div>
            </div>
          );
        })}
      </div>
      {editingProperty && (
        <ModalForm
          title={`Edit — ${editingProperty.nameId}`}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => {
            setEditingProperty(null);
            resetHotelStates();
          }}
          isAdd={false}
          typeBadge={typeBadge}
          typeDisplay={typeDisplay}
          newUnitName={newUnitName}
          setNewUnitName={setNewUnitName}
          isUnitSubmitting={isUnitSubmitting}
          setIsUnitSubmitting={setIsUnitSubmitting}
          unitMessage={unitMessage}
          setUnitMessage={setUnitMessage}
          handleAddUnit={handleAddUnit}
          handleDeleteUnit={handleDeleteUnit}
          roomTypeForm={roomTypeForm}
          setRoomTypeForm={setRoomTypeForm}
          roomForm={roomForm}
          setRoomForm={setRoomForm}
          editingRoomTypeIndex={editingRoomTypeIndex}
          setEditingRoomTypeIndex={setEditingRoomTypeIndex}
          showAddRoomType={showAddRoomType}
          setShowAddRoomType={setShowAddRoomType}
          showAddRoom={showAddRoom}
          setShowAddRoom={setShowAddRoom}
          handleAddRoomType={handleAddRoomType}
          handleSaveRoomType={handleSaveRoomType}
          handleEditRoomType={handleEditRoomType}
          handleUpdateRoomType={handleUpdateRoomType}
          handleDeleteRoomType={handleDeleteRoomType}
          handleAddRoom={handleAddRoom}
          handleSaveRoom={handleSaveRoom}
          handleDeleteRoom={handleDeleteRoom}
        />
      )}
      {showAddModal && (
        <ModalForm
          title="Tambah Properti Baru"
          form={form}
          setForm={setForm}
          onSave={handleSaveAdd}
          onClose={() => {
            setShowAddModal(false);
            resetHotelStates();
          }}
          isAdd={true}
          typeBadge={typeBadge}
          typeDisplay={typeDisplay}
          newUnitName={newUnitName}
          setNewUnitName={setNewUnitName}
          isUnitSubmitting={isUnitSubmitting}
          setIsUnitSubmitting={setIsUnitSubmitting}
          unitMessage={unitMessage}
          setUnitMessage={setUnitMessage}
          handleAddUnit={handleAddUnit}
          handleDeleteUnit={handleDeleteUnit}
          roomTypeForm={roomTypeForm}
          setRoomTypeForm={setRoomTypeForm}
          roomForm={roomForm}
          setRoomForm={setRoomForm}
          editingRoomTypeIndex={editingRoomTypeIndex}
          setEditingRoomTypeIndex={setEditingRoomTypeIndex}
          showAddRoomType={showAddRoomType}
          setShowAddRoomType={setShowAddRoomType}
          showAddRoom={showAddRoom}
          setShowAddRoom={setShowAddRoom}
          handleAddRoomType={handleAddRoomType}
          handleSaveRoomType={handleSaveRoomType}
          handleEditRoomType={handleEditRoomType}
          handleUpdateRoomType={handleUpdateRoomType}
          handleDeleteRoomType={handleDeleteRoomType}
          handleAddRoom={handleAddRoom}
          handleSaveRoom={handleSaveRoom}
          handleDeleteRoom={handleDeleteRoom}
        />
      )}
    </div>
  );
}

// ===== ModalForm Component (dipindahkan ke luar) =====
function ModalForm({
  title,
  form,
  setForm,
  onSave,
  onClose,
  isAdd,
  typeBadge,
  typeDisplay,
  newUnitName,
  setNewUnitName,
  isUnitSubmitting,
  setIsUnitSubmitting,
  unitMessage,
  setUnitMessage,
  handleAddUnit,
  handleDeleteUnit,
  roomTypeForm,
  setRoomTypeForm,
  roomForm,
  setRoomForm,
  editingRoomTypeIndex,
  setEditingRoomTypeIndex,
  showAddRoomType,
  setShowAddRoomType,
  showAddRoom,
  setShowAddRoom,
  handleAddRoomType,
  handleSaveRoomType,
  handleEditRoomType,
  handleUpdateRoomType,
  handleDeleteRoomType,
  handleAddRoom,
  handleSaveRoom,
  handleDeleteRoom,
}: ModalFormProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">{title}</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Nama Properti */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Properti (ID)</label>
              <input placeholder="Contoh: RF Hotel 1 Syariah" value={form.nameId} onChange={e => setForm({...form, nameId: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Properti (EN)</label>
              <input placeholder="Example: RF Hotel 1 Sharia" value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>

            {/* Tipe Properti */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Properti</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option value="hotel">Hotel</option>
                <option value="kos">Kos</option>
                <option value="apartemen">Apartemen</option>
                <option value="rumah">Rumah/Villa</option>
              </select>
            </div>

            <div></div>

            {/* Lokasi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi (ID)</label>
              <input placeholder="Contoh: Jakarta (Rasuna Said)" value={form.locationId} onChange={e => setForm({...form, locationId: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi (EN)</label>
              <input placeholder="Example: Jakarta (Rasuna Said)" value={form.locationEn} onChange={e => setForm({...form, locationEn: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Maps</label>
              <input
                type="text"
                placeholder="https://www.google.com/maps/place/..."
                value={form.mapsUrl}
                onChange={e => setForm({...form, mapsUrl: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Buka Google Maps, cari lokasi, klik "Share" → "Copy link". Paste link lengkapnya di sini.
              </p>
              {form.mapsUrl && (
                <p className={`text-xs mt-1 ${extractMapsEmbedUrl(form.mapsUrl) ? 'text-green-600' : 'text-amber-600'}`}>
                  {extractMapsEmbedUrl(form.mapsUrl)
                    ? '✓ Link valid, peta akan muncul di halaman detail'
                    : '⚠ Format link tidak dikenali — pastikan link mengandung koordinat (ada simbol @ diikuti angka)'}
                </p>
              )}
            </div>  

            {/* Kapasitas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Min (orang)</label>
              <input type="number" placeholder="Minimal orang" value={form.capacityMin} onChange={e => setForm({...form, capacityMin: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Max (orang)</label>
              <input type="number" placeholder="Maksimal orang" value={form.capacityMax} onChange={e => setForm({...form, capacityMax: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
            </div>

            {/* Deskripsi */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (ID)</label>
              <textarea placeholder="Deskripsi properti dalam Bahasa Indonesia" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (EN)</label>
              <textarea placeholder="Property description in English" rows={2} value={form.descriptionEn} onChange={e => setForm({...form, descriptionEn: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
            </div>

            {/* Harga */}
            {form.type !== 'kos' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Weekday (per malam)</label>
                  <input type="number" placeholder="Contoh: 350000" value={form.pricingWeekday} onChange={e => setForm({...form, pricingWeekday: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Weekend (per malam)</label>
                  <input type="number" placeholder="Contoh: 450000" value={form.pricingWeekend} onChange={e => setForm({...form, pricingWeekend: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Bulanan (WNI)</label>
                  <input type="number" placeholder="Contoh: 2900000" value={form.monthlyPricingWNI} onChange={e => setForm({...form, monthlyPricingWNI: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Bulanan (WNA)</label>
                  <input type="number" placeholder="Contoh: 3500000" value={form.monthlyPricingWNA} onChange={e => setForm({...form, monthlyPricingWNA: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </>
            )}

            {/* Gambar */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        toast.error(err.error || 'Upload gagal');
                        return;
                      }
                      const data = await res.json();
                      setForm((prev: any) => ({ ...prev, image: data.url }));
                    } catch (err) {
                      toast.error('Terjadi kesalahan saat upload.');
                      console.error(err);
                    }
                    // Reset input agar bisa upload ulang file yang sama
                    e.target.value = '';
                  }}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                <span className="text-xs text-gray-500">(max 5MB, JPG/PNG/WebP)</span>
              </div>
              {form.image && (
                <div className="relative mt-2 inline-block">
                  <img src={form.image} className="h-20 w-20 object-cover rounded border" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => setForm((prev: any) => ({ ...prev, image: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Images</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const uploadPromises = Array.from(files).map(async (file) => {
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Upload gagal');
                      }
                      const data = await res.json();
                      return data.url;
                    });
                    try {
                      const urls = await Promise.all(uploadPromises);
                      setForm((prev: any) => ({
                        ...prev,
                        images: [...prev.images, ...urls],
                      }));
                    } catch (err: any) {
                      toast.error(err.message || 'Salah satu gambar gagal diupload.');
                      console.error(err);
                    }
                    e.target.value = '';
                  }}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                <span className="text-xs text-gray-500">(max 5MB per file, JPG/PNG/WebP)</span>
              </div>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative inline-block">
                      <img src={img} className="h-16 w-16 object-cover rounded border" alt={`Gallery ${idx}`} />
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev: any) => ({
                            ...prev,
                            images: prev.images.filter((_: string, i: number) => i !== idx),
                          }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Galeri Kategori (Eksterior / Lobby / Fasilitas / Kamar)
              </label>
              <div className="flex items-center gap-3 mb-2">
                <select
                  id="categorySelect"
                  defaultValue="eksterior"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="eksterior">Eksterior</option>
                  <option value="lobby">Lobby & Area Umum</option>
                  <option value="fasilitas">Fasilitas</option>
                  <option value="kamar">Cuplikan Kamar</option>
                </select>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const categorySelect = document.getElementById('categorySelect') as HTMLSelectElement;
                    const category = categorySelect?.value || 'eksterior';
                    const uploadPromises = Array.from(files).map(async (file) => {
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Upload gagal');
                      }
                      const data = await res.json();
                      return { url: data.url, category };
                    });
                    try {
                      const newItems = await Promise.all(uploadPromises);
                      setForm((prev: any) => ({
                        ...prev,
                        imagesCategorized: [...(prev.imagesCategorized || []), ...newItems],
                      }));
                    } catch (err: any) {
                      toast.error(err.message || 'Salah satu gambar gagal diupload.');
                      console.error(err);
                    }
                    e.target.value = '';
                  }}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
              </div>
              {form.imagesCategorized && form.imagesCategorized.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.imagesCategorized.map((item: { url: string; category: string }, idx: number) => (
                    <div key={idx} className="relative inline-block">
                      <img src={item.url} className="h-16 w-16 object-cover rounded border" alt={`${item.category} ${idx}`} />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 rounded-b">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev: any) => ({
                            ...prev,
                            imagesCategorized: prev.imagesCategorized.filter((_: any, i: number) => i !== idx),
                          }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fasilitas (pilih yang tersedia)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FACILITY_OPTIONS.map((opt) => {
                  const isChecked = form.facilities.some((f: any) => f.icon === opt.key);
                  const Icon = opt.icon;
                  return (
                    <label
                      key={opt.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${
                        isChecked ? 'border-brand-green bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setForm((prev: any) => {
                            const exists = prev.facilities.some((f: any) => f.icon === opt.key);
                            if (exists) {
                              return {
                                ...prev,
                                facilities: prev.facilities.filter((f: any) => f.icon !== opt.key),
                              };
                            }
                            return {
                              ...prev,
                              facilities: [
                                ...prev.facilities,
                                { label: opt.labelId, labelEn: opt.labelEn, icon: opt.key },
                              ],
                            };
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <Icon className="w-4 h-4 text-brand-green flex-shrink-0" />
                      <span className="text-charcoal">{opt.labelId}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Rules */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rules (ID) - satu per baris</label>
              <textarea
                rows={3}
                value={form.rules.join('\n')}
                onChange={e => setForm({...form, rules: e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean)})}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Dilarang merokok&#10;Check-in 14:00"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rules (EN) - satu per baris</label>
              <textarea
                rows={3}
                value={form.rulesEn.join('\n')}
                onChange={e => setForm({...form, rulesEn: e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean)})}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="No smoking&#10;Check-in 14:00"
              />
            </div>

            {/* ===== KELOLA TIPE KAMAR (khusus HOTEL) ===== */}
            {form.type === 'hotel' && (
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-md">Kelola Tipe Kamar</h4>
                  <button
                    onClick={handleAddRoomType}
                    className="bg-brand-green text-white px-3 py-1 rounded text-sm hover:bg-green-hover transition"
                  >
                    + Tambah Tipe Kamar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Kelola tipe kamar (Deluxe, Standard, Suite, dll) beserta nomor kamarnya.
                  Nomor kamar hanya untuk internal admin, tidak ditampilkan ke user.
                </p>

                {form.roomTypes.length === 0 ? (
                  <p className="text-sm text-gray-400 mb-2">Belum ada tipe kamar.</p>
                ) : (
                  <div className="space-y-4">
                    {form.roomTypes.map((rt: any, rtIdx: number) => (
                      <div key={rtIdx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-charcoal">{rt.nameId} / {rt.nameEn}</h5>
                            <p className="text-sm text-gray-600">Kapasitas: {rt.capacity} orang</p>
                            <p className="text-sm text-gold">
                              Weekday: Rp {rt.priceWeekday.toLocaleString('id-ID')} | Weekend: Rp {rt.priceWeekend.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-400">{rt.rooms.length} kamar</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRoomType(rtIdx)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRoomType(rtIdx)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        {/* Daftar Kamar di dalam Room Type */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-medium text-gray-500">Nomor Kamar</p>
                            <button
                              onClick={() => handleAddRoom(rtIdx)}
                              className="text-brand-green hover:underline text-xs"
                            >
                              + Tambah Kamar
                            </button>
                          </div>
                          {rt.rooms.length === 0 ? (
                            <p className="text-xs text-gray-400">Belum ada kamar.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {rt.rooms.map((r: any, rIdx: number) => (
                                <span key={rIdx} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                  {r.roomNumber}
                                  <button
                                    onClick={() => handleDeleteRoom(rtIdx, rIdx)}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal Tambah/Edit Room Type */}
                {(showAddRoomType || editingRoomTypeIndex !== null) && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                      <h4 className="text-lg font-bold mb-4">
                        {editingRoomTypeIndex !== null ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar'}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tipe (ID)</label>
                          <input
                            type="text"
                            value={roomTypeForm.nameId}
                            onChange={e => setRoomTypeForm({...roomTypeForm, nameId: e.target.value})}
                            placeholder="Contoh: Deluxe Room"
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tipe (EN)</label>
                          <input
                            type="text"
                            value={roomTypeForm.nameEn}
                            onChange={e => setRoomTypeForm({...roomTypeForm, nameEn: e.target.value})}
                            placeholder="Example: Deluxe Room"
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas (orang)</label>
                          <input
                            type="number"
                            value={roomTypeForm.capacity}
                            onChange={e => setRoomTypeForm({...roomTypeForm, capacity: Number(e.target.value)})}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Harga Weekday (per malam)</label>
                          <input
                            type="number"
                            value={roomTypeForm.priceWeekday}
                            onChange={e => setRoomTypeForm({...roomTypeForm, priceWeekday: Number(e.target.value)})}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Contoh: 350000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Harga Weekend (per malam)</label>
                          <input
                            type="number"
                            value={roomTypeForm.priceWeekend}
                            onChange={e => setRoomTypeForm({...roomTypeForm, priceWeekend: Number(e.target.value)})}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Contoh: 450000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Foto Tipe Kamar</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (!files || files.length === 0) return;
                                const uploadPromises = Array.from(files).map(async (file) => {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const res = await fetch('/api/admin/upload', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  if (!res.ok) {
                                    const err = await res.json();
                                    throw new Error(err.error || 'Upload gagal');
                                  }
                                  const data = await res.json();
                                  return data.url;
                                });
                                try {
                                  const urls = await Promise.all(uploadPromises);
                                  setRoomTypeForm((prev: any) => ({
                                    ...prev,
                                    images: [...(prev.images || []), ...urls],
                                  }));
                                } catch (err: any) {
                                  toast.error(err.message || 'Salah satu gambar gagal diupload.');
                                  console.error(err);
                                }
                                e.target.value = '';
                              }}
                              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                            />
                            <span className="text-xs text-gray-500">(max 5MB per file)</span>
                          </div>
                          {roomTypeForm.images && roomTypeForm.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {roomTypeForm.images.map((img: string, idx: number) => (
                                <div key={idx} className="relative inline-block">
                                  <img src={img} className="h-16 w-16 object-cover rounded border" alt={`Room type ${idx}`} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoomTypeForm((prev: any) => ({
                                        ...prev,
                                        images: prev.images.filter((_: string, i: number) => i !== idx),
                                      }));
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Kamar</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={roomForm.roomNumber}
                              onChange={e => setRoomForm({roomNumber: e.target.value})}
                              placeholder="Contoh: 101"
                              className="flex-1 border rounded-lg px-3 py-2"
                            />
                            <button
                              onClick={() => {
                                if (!roomForm.roomNumber.trim()) {
                                  toast.error('Nomor kamar wajib diisi.');
                                  return;
                                }
                                setRoomTypeForm({
                                  ...roomTypeForm,
                                  rooms: [...roomTypeForm.rooms, { roomNumber: roomForm.roomNumber.trim() }],
                                });
                                setRoomForm({ roomNumber: '' });
                              }}
                              className="bg-gray-200 px-3 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                              Tambah
                            </button>
                          </div>
                          {roomTypeForm.rooms.length === 0 ? (
                            <p className="text-xs text-gray-400">Belum ada kamar</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {roomTypeForm.rooms.map((r: { roomNumber: string }, idx: number) => (
                                <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                  {r.roomNumber}
                                  <button
                                    onClick={() => {
                                      const updated = roomTypeForm.rooms.filter((_: any, i: number) => i !== idx);
                                      setRoomTypeForm({...roomTypeForm, rooms: updated});
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={editingRoomTypeIndex !== null ? handleUpdateRoomType : handleSaveRoomType}
                          className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-hover transition"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setShowAddRoomType(false);
                            setEditingRoomTypeIndex(null);
                            setRoomTypeForm({ nameId: '', nameEn: '', capacity: 2, priceWeekday: 0, priceWeekend: 0, images: [], rooms: [] });
                            setRoomForm({ roomNumber: '' });
                          }}
                          className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Tambah Kamar */}
                {showAddRoom !== null && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                      <h4 className="text-lg font-bold mb-4">Tambah Kamar</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Kamar</label>
                        <input
                          type="text"
                          value={roomForm.roomNumber}
                          onChange={e => setRoomForm({roomNumber: e.target.value})}
                          placeholder="Contoh: 103"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleSaveRoom}
                          className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-hover transition"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setShowAddRoom(null);
                            setRoomForm({ roomNumber: '' });
                          }}
                          className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== DAFTAR UNIT (khusus KOS, APARTEMEN, RUMAH) ===== */}
            {form.type !== 'hotel' && (
              <div className="col-span-2 border-t pt-4 mt-2">
                <h4 className="font-bold text-md mb-2">Daftar Unit / Kamar</h4>
                <p className="text-xs text-gray-500 mb-2">
                  Kelola daftar unit/kamar untuk properti ini.
                </p>

                {form.units && form.units.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.units.map((u: any) => (
                      <span key={u.unitId} className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {u.unitName}
                        <button
                          onClick={() => handleDeleteUnit(u.unitId, u.unitName)}
                          className="text-red-500 hover:text-red-700 text-xs"
                          disabled={isUnitSubmitting}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-3">Belum ada unit/kamar.</p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Nama Unit (contoh: Unit A, Kamar 101)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-sm"
                    disabled={isUnitSubmitting}
                  />
                  <button
                    onClick={handleAddUnit}
                    disabled={isUnitSubmitting || !newUnitName.trim()}
                    className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-green-hover transition disabled:opacity-50 text-sm"
                  >
                    {isUnitSubmitting ? '...' : 'Tambah'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  💡 Unit yang sudah punya booking aktif di masa depan tidak bisa dihapus.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onSave} className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-hover transition">Simpan</button>
            <button onClick={onClose} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition">Batal</button>
          </div>
        </div>
      </div>
    </div>
  );
}