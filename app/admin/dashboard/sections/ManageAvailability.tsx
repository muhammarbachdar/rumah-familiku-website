'use client';

import { useState, useEffect } from 'react';
import {
  fetchProperties,
  fetchAvailability,
  addBooking,
  addBookingUnit,
  addBookingRoom,
  addBookingDates,
  deleteBooking,
} from '@/lib/api';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { getAvailabilityMode, formatDate, getBookedDates } from '@/lib/utils/availability';
import { toLocalDateStr } from '@/lib/utils/date';
import { toast } from 'sonner';

export default function ManageAvailabilitySection() {
  // States
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Booking states
  const [mode, setMode] = useState<'range' | 'manual'>('range');
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [note, setNote] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(''); // NEW: untuk Hotel
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>(''); // NEW: untuk Hotel
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [props, avail] = await Promise.all([fetchProperties(), fetchAvailability()]);
      setProperties(props || []);
      if (props && props.length > 0) {
        setSelectedPropertyId(props[0].id);
        setSelectedProperty(props[0]);
        const propAvail = avail?.[props[0].id] || null;
        setAvailabilityData(propAvail);
        initializeUnitSelection(propAvail, props[0]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Gagal memuat data availability.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize unit/room selection based on property type
  const initializeUnitSelection = (availData: any, property: any) => {
    if (!availData || !property) return;

    const modeType = getAvailabilityMode(property.type);

    if (modeType === 'unit') {
      if (property.type === 'hotel' && availData.roomTypes && availData.roomTypes.length > 0) {
        const firstRoomType = availData.roomTypes[0];
        setSelectedRoomTypeId(firstRoomType.roomTypeId);
        if (firstRoomType.rooms && firstRoomType.rooms.length > 0) {
          setSelectedRoomId(firstRoomType.rooms[0].roomId);
        }
      } else if (availData.units && availData.units.length > 0) {
        setSelectedUnitId(availData.units[0].unitId);
      }
    }
  };

  // Handle property change
  useEffect(() => {
    if (selectedPropertyId && properties.length > 0) {
      const prop = properties.find((p: any) => p.id === selectedPropertyId);
      setSelectedProperty(prop);

      // Fetch availability untuk properti ini
      fetchAvailability(selectedPropertyId)
        .then((data) => {
          setAvailabilityData(data);
          initializeUnitSelection(data, prop);
          // Reset form
          setSelectedDates([]);
          setSelectedRange({ start: null, end: null });
          setNote('');
          setMessage(null);
        })
        .catch((err) => {
          console.error('Failed to fetch availability:', err);
          toast.error('Gagal memuat data availability.');
        });
    }
  }, [selectedPropertyId]);

  // Get booked dates for calendar
  const getBookedDatesForDisplay = () => {
    if (!availabilityData) return [];

    if (availabilityData.mode === 'property') {
      return getBookedDates(availabilityData.bookings || []);
    }

    if (selectedProperty?.type === 'hotel' && selectedRoomId) {
      // Hotel: cari roomType -> room
      const roomType = availabilityData.roomTypes?.find(
        (rt: any) => rt.roomTypeId === selectedRoomTypeId
      );
      if (roomType) {
        const room = roomType.rooms?.find((r: any) => r.roomId === selectedRoomId);
        return getBookedDates(room?.bookings || []);
      }
      return [];
    }

    if (selectedUnitId) {
      // Kos / Apartemen / Rumah
      const unit = availabilityData.units?.find((u: any) => u.unitId === selectedUnitId);
      return getBookedDates(unit?.bookings || []);
    }

    return [];
  };

  // Get current bookings list
  const getCurrentBookings = () => {
    if (!availabilityData) return [];

    if (availabilityData.mode === 'property') {
      return availabilityData.bookings || [];
    }

    if (selectedProperty?.type === 'hotel' && selectedRoomId) {
      const roomType = availabilityData.roomTypes?.find(
        (rt: any) => rt.roomTypeId === selectedRoomTypeId
      );
      if (roomType) {
        const room = roomType.rooms?.find((r: any) => r.roomId === selectedRoomId);
        return room?.bookings || [];
      }
      return [];
    }

    if (selectedUnitId) {
      const unit = availabilityData.units?.find((u: any) => u.unitId === selectedUnitId);
      return unit?.bookings || [];
    }

    return [];
  };

  const bookedDates = getBookedDatesForDisplay();
  const bookings = getCurrentBookings();

  // Handle range select
  const handleRangeSelect = (start: Date, end: Date) => {
    setSelectedRange({ start, end });
  };

  // Handle submit booking
  const handleSubmitBooking = async () => {
    if (!selectedProperty) return;

    const modeType = getAvailabilityMode(selectedProperty.type);
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (mode === 'range') {
        if (!selectedRange.start || !selectedRange.end) {
          setMessage({ type: 'error', text: 'Pilih tanggal awal dan akhir terlebih dahulu.' });
          setIsSubmitting(false);
          return;
        }

        const startDate = toLocalDateStr(selectedRange.start);
        const endDate = toLocalDateStr(selectedRange.end);

        if (modeType === 'property') {
          await addBooking(selectedProperty.id, startDate, endDate, note);
        } else if (selectedProperty.type === 'hotel') {
          if (!selectedRoomId) {
            setMessage({ type: 'error', text: 'Pilih kamar terlebih dahulu.' });
            setIsSubmitting(false);
            return;
          }
          await addBookingRoom(selectedProperty.id, selectedRoomId, startDate, endDate, note);
        } else {
          if (!selectedUnitId) {
            setMessage({ type: 'error', text: 'Pilih unit/kamar terlebih dahulu.' });
            setIsSubmitting(false);
            return;
          }
          await addBookingUnit(selectedProperty.id, selectedUnitId, startDate, endDate, note);
        }
      } else {
        // Manual mode
        if (selectedDates.length === 0) {
          setMessage({ type: 'error', text: 'Pilih minimal 1 tanggal.' });
          setIsSubmitting(false);
          return;
        }

        const dateStrings = selectedDates.map((d) => toLocalDateStr(d));

        if (selectedProperty.type === 'hotel') {
          await addBookingDates(selectedProperty.id, dateStrings, note, undefined, selectedRoomId);
        } else if (modeType === 'unit') {
          await addBookingDates(selectedProperty.id, dateStrings, note, selectedUnitId);
        } else {
          await addBookingDates(selectedProperty.id, dateStrings, note);
        }
      }

      setMessage({ type: 'success', text: 'Booking berhasil ditambahkan!' });
      toast.success('Booking berhasil ditambahkan!');

      // Refresh data
      const refreshed = await fetchAvailability(selectedProperty.id);
      setAvailabilityData(refreshed);
      initializeUnitSelection(refreshed, selectedProperty);

      // Reset form
      setSelectedDates([]);
      setSelectedRange({ start: null, end: null });
      setNote('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menambahkan booking.' });
      toast.error(err.message || 'Gagal menambahkan booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Hapus booking ini?')) return;
    if (!selectedProperty) return;

    try {
      const modeType = getAvailabilityMode(selectedProperty.type);
      let targetId: string | undefined;

      if (selectedProperty.type === 'hotel') {
        targetId = selectedRoomId;
      } else if (modeType === 'unit') {
        targetId = selectedUnitId;
      }

      await deleteBooking(selectedProperty.id, bookingId, targetId);

      // Refresh data
      const refreshed = await fetchAvailability(selectedProperty.id);
      setAvailabilityData(refreshed);
      initializeUnitSelection(refreshed, selectedProperty);
      setMessage({ type: 'success', text: 'Booking berhasil dihapus!' });
      toast.success('Booking berhasil dihapus!');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus booking.' });
      toast.error(err.message || 'Gagal menghapus booking.');
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Loading availability data...</div>;
  }

  const isUnitMode = selectedProperty && getAvailabilityMode(selectedProperty.type) === 'unit';
  const isHotel = selectedProperty?.type === 'hotel';
  const roomTypes = availabilityData?.roomTypes || [];
  const units = availabilityData?.units || [];

  // Get available room options for hotel
  const getRoomOptions = () => {
    const roomType = roomTypes.find((rt: any) => rt.roomTypeId === selectedRoomTypeId);
    return roomType?.rooms || [];
  };

  const roomOptions = getRoomOptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-charcoal mb-4">Manage Availability</h2>

        {/* Select Property */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Properti</label>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            {properties.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.nameId} ({p.type})
              </option>
            ))}
          </select>
        </div>

        {/* Unit Selector untuk Hotel */}
        {isHotel && isUnitMode && (
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Tipe Kamar</label>
                <select
                  value={selectedRoomTypeId}
                  onChange={(e) => {
                    const newRoomTypeId = e.target.value;
                    setSelectedRoomTypeId(newRoomTypeId);
                    // Auto-select first room of this room type
                    const roomType = roomTypes.find((rt: any) => rt.roomTypeId === newRoomTypeId);
                    if (roomType?.rooms?.length > 0) {
                      setSelectedRoomId(roomType.rooms[0].roomId);
                    } else {
                      setSelectedRoomId('');
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {roomTypes.map((rt: any) => (
                    <option key={rt.roomTypeId} value={rt.roomTypeId}>
                      {rt.roomTypeName} ({rt.rooms?.length || 0} kamar)
                    </option>
                  ))}
                  {roomTypes.length === 0 && (
                    <option value="">Belum ada tipe kamar</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kamar</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {roomOptions.map((r: any) => (
                    <option key={r.roomId} value={r.roomId}>
                      {r.roomNumber}
                    </option>
                  ))}
                  {roomOptions.length === 0 && (
                    <option value="">Belum ada kamar</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Unit Selector untuk Kos / Apartemen / Rumah */}
        {!isHotel && isUnitMode && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Unit / Kamar</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              {units.map((u: any) => (
                <option key={u.unitId} value={u.unitId}>
                  {u.unitName}
                </option>
              ))}
              {units.length === 0 && (
                <option value="">Belum ada unit</option>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Calendar & Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Calendar */}
          <div>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setMode('range')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  mode === 'range' ? 'bg-brand-green text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Mode Range
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  mode === 'manual' ? 'bg-brand-green text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Mode Manual
              </button>
            </div>

            <AvailabilityCalendar
              bookedDates={bookedDates}
              mode={mode === 'range' ? 'select-range' : 'select-dates'}
              onSelectRange={handleRangeSelect}
              onSelectDates={setSelectedDates}
              selectedDates={selectedDates}
            />
          </div>

          {/* Right: Form */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              {mode === 'range' ? 'Tambah Booking (Range)' : 'Tambah Booking (Manual)'}
            </h3>

            {mode === 'range' && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {selectedRange.start && !selectedRange.end && 'Pilih tanggal akhir...'}
                  {selectedRange.start && selectedRange.end && (
                    <>
                      Range: {selectedRange.start.toLocaleDateString('id-ID')} -{' '}
                      {selectedRange.end.toLocaleDateString('id-ID')}
                    </>
                  )}
                  {!selectedRange.start && 'Klik tanggal awal di kalender.'}
                </p>
              </div>
            )}

            {mode === 'manual' && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {selectedDates.length === 0 && 'Klik tanggal di kalender untuk memilih.'}
                  {selectedDates.length > 0 && `${selectedDates.length} tanggal dipilih.`}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nama tamu atau keterangan"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <button
              onClick={handleSubmitBooking}
              disabled={isSubmitting}
              className="w-full bg-brand-green text-white py-3 rounded-lg font-bold hover:bg-green-hover transition disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Tambah Booking'}
            </button>
          </div>
        </div>
      </div>

      {/* Booking List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-charcoal mb-4">Daftar Booking</h3>

        {bookings.length === 0 ? (
          <p className="text-gray-text">Belum ada booking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Tanggal Mulai
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Tanggal Selesai
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">Catatan</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{formatDate(b.startDate)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(b.endDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.note || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className="text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}