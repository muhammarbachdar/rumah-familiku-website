'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchProperties, fetchAvailability } from '@/lib/api';
import { formatPrice, getWhatsAppURL, generateHotelBookingMessage } from '@/lib/utils/whatsapp';
import { getBookedDates } from '@/lib/utils/availability';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { fetchSite } from '@/lib/api';
import Link from 'next/link';

export default function RoomTypeDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const roomTypeId = params.roomTypeId as string;

  const [property, setProperty] = useState<any>(null);
  const [roomType, setRoomType] = useState<any>(null);
  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bookingCheckIn, setBookingCheckIn] = useState('');
  const [bookingCheckOut, setBookingCheckOut] = useState('');
  const [bookingGuests, setBookingGuests] = useState(1);

  const getBookedDatesForRoomType = () => {
    if (!roomType || !roomType.rooms || roomType.rooms.length === 0) return [];
    const totalRooms = roomType.rooms.length;
    const dateBookedCount: Record<string, number> = {};
    for (const room of roomType.rooms) {
      const roomBookedDates = getBookedDates(room.bookings || []);
      for (const date of roomBookedDates) {
        dateBookedCount[date] = (dateBookedCount[date] || 0) + 1;
      }
    }
    return Object.keys(dateBookedCount).filter((date) => dateBookedCount[date] >= totalRooms);
  };

  const bookedDates = roomType ? getBookedDatesForRoomType() : [];

  useEffect(() => {
    Promise.all([fetchProperties(), fetchSite()])
      .then(([propertiesData, siteResult]) => {
        const found = propertiesData.find((p: any) => p.slug === slug);
        if (!found) {
          setLoading(false);
          return;
        }
        setProperty(found);
        setSiteData(siteResult);

        fetchAvailability(found.id)
          .then((data) => {
            const rt = data?.roomTypes?.find((r: any) => r.roomTypeId === roomTypeId);
            setRoomType(rt || null);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load availability:', err);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error('Failed to load property:', err);
        setLoading(false);
      });
  }, [slug, roomTypeId]);

  const handleBooking = () => {
    if (!bookingCheckIn || !bookingCheckOut) {
      alert(locale === 'id' ? 'Silakan isi Check In dan Check Out.' : 'Please fill in Check In and Check Out.');
      return;
    }
    const displayName = locale === 'id' ? property.nameId : property.nameEn;
    const message = generateHotelBookingMessage(
      displayName,
      roomType.roomTypeName,
      bookingGuests,
      bookingCheckIn,
      bookingCheckOut,
      locale
    );
    window.open(getWhatsAppURL(message, siteData?.whatsappNumber), '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-text">{t('common.loading')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property || !roomType) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-2xl text-gray-text">Room type not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = locale === 'id' ? property.nameId : property.nameEn;
  const displayRules = locale === 'id' ? property.rules : property.rulesEn;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="bg-brand-green text-white py-6">
          <div className="container mx-auto px-4">
            <Link href={`/${locale}/properties/${slug}/harga`} className="text-white/80 hover:text-white text-sm mb-2 inline-block">
              ← {displayName} - {locale === 'id' ? 'Daftar Harga' : 'Price List'}
            </Link>
            <h1 className="font-serif text-2xl md:text-3xl font-bold">{roomType.roomTypeName}</h1>
          </div>
        </section>

        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Galeri foto */}
            {roomType.images && roomType.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
                {roomType.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${roomType.roomTypeName} ${idx + 1}`}
                    className="h-64 w-auto flex-shrink-0 object-cover rounded-xl"
                  />
                ))}
              </div>
            )}

            <p className="text-2xl font-bold text-gold mb-1">{formatPrice(roomType.priceWeekday)}</p>
            <p className="text-sm text-gray-text mb-6">
              {locale === 'id' ? 'Mulai dari, per malam' : 'Starting from, per night'}
            </p>

            {/* Kalender Ketersediaan */}
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                {locale === 'id' ? 'Ketersediaan' : 'Availability'}
              </h2>
              <AvailabilityCalendar bookedDates={bookedDates} mode="view" locale={locale === 'id' ? 'id' : 'en'} />
              <p className="text-xs text-gray-500 mt-2">
                {locale === 'id'
                  ? 'Kalender hanya untuk perkiraan, silakan hubungi kami via WhatsApp untuk konfirmasi final.'
                  : 'Calendar is for estimation only, please contact us via WhatsApp for final confirmation.'}
              </p>
            </div>

            {/* Informasi Harga & Opsi */}
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                {locale === 'id' ? 'Informasi Harga' : 'Price Information'}
              </h2>
              <div className="bg-cream rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-text">{locale === 'id' ? 'Weekday' : 'Weekday'}</span>
                  <span className="font-bold text-charcoal">{formatPrice(roomType.priceWeekday)}/{locale === 'id' ? 'malam' : 'night'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-text">{locale === 'id' ? 'Weekend' : 'Weekend'}</span>
                  <span className="font-bold text-charcoal">{formatPrice(roomType.priceWeekend)}/{locale === 'id' ? 'malam' : 'night'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-text">{locale === 'id' ? 'Kapasitas' : 'Capacity'}</span>
                  <span className="font-bold text-charcoal">{roomType.capacity || 2} {locale === 'id' ? 'orang' : 'people'}</span>
                </div>
              </div>
            </div>

            {/* Kebijakan Kamar (dari property.rules) */}
            {displayRules && displayRules.length > 0 && (
              <div className="mb-6">
                <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                  {locale === 'id' ? 'Kebijakan' : 'Policy'}
                </h2>
                <ul className="space-y-1.5">
                  {displayRules.map((rule: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-text text-sm">
                      <span className="text-brand-green font-bold mt-0.5">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Form Booking */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="font-bold text-charcoal mb-3">
                {locale === 'id' ? `Siap memesan ${roomType.roomTypeName}?` : `Ready to book ${roomType.roomTypeName}?`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input
                    type="date"
                    value={bookingCheckIn}
                    onChange={(e) => setBookingCheckIn(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input
                    type="date"
                    value={bookingCheckOut}
                    onChange={(e) => setBookingCheckOut(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    min={bookingCheckIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'id' ? 'Jumlah Tamu' : 'Guests'}
                  </label>
                  <input
                    type="number"
                    value={bookingGuests}
                    onChange={(e) => setBookingGuests(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                    min={1}
                    max={roomType.capacity || 10}
                  />
                </div>
              </div>
              <button
                onClick={handleBooking}
                className="w-full bg-brand-green text-white py-2.5 rounded-lg font-medium hover:bg-green-hover transition"
              >
                {t('propertyDetail.bookWhatsapp')}
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}