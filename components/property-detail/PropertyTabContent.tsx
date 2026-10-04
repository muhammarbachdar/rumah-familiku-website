// components/property-detail/PropertyTabContent.tsx
'use client';

import { FACILITY_OPTIONS } from '@/lib/constants/facilities';
import { extractMapsEmbedUrl } from '@/lib/maps';

interface PropertyTabContentProps {
  activeTab: string;
  tabs: readonly string[];
  displayDescription: string;
  displayRules: string[];
  facilities: { label: string; labelEn: string; icon: string }[];
  displayLocation: string;
  mapsUrl: string;
  locale: string;
  // Optional untuk hotel
  roomTypes?: any[];
  propertySlug?: string;
  availabilityData?: any;
}

export function PropertyTabContent({
  activeTab,
  tabs,
  displayDescription,
  displayRules,
  facilities,
  displayLocation,
  mapsUrl,
  locale,
  roomTypes,
  propertySlug,
  availabilityData,
}: PropertyTabContentProps) {
  const isHotel = tabs.includes('kamar');

  // Ringkasan
  if (activeTab === 'ringkasan') {
    return (
      <div>
        <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
          {locale === 'id' ? 'Tentang Properti' : 'About This Property'}
        </h2>
        <p className="text-gray-text leading-relaxed mb-6">{displayDescription}</p>

        <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
          {locale === 'id' ? 'Fasilitas Unggulan' : 'Featured Facilities'}
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {(facilities || []).slice(0, 6).map((facility, idx: number) => {
            const facilityOption = FACILITY_OPTIONS.find((opt) => opt.key === facility.icon);
            const Icon = facilityOption?.icon;
            const label = locale === 'id' ? facility.label : facility.labelEn;
            return (
              <li key={idx} className="flex items-center gap-3">
                {Icon && <Icon className="w-4 h-4 text-brand-green flex-shrink-0" />}
                <span className="text-gray-text">{label}</span>
              </li>
            );
          })}
        </ul>

        <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
          {locale === 'id' ? 'Aturan & Kebijakan' : 'Rules & Policy'}
        </h2>
        <ul className="space-y-2">
          {(displayRules || []).slice(0, 4).map((rule: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-gray-text">
              <span className="text-brand-green font-bold mt-0.5">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Fasilitas
  if (activeTab === 'fasilitas') {
    return (
      <div>
        <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
          {locale === 'id' ? 'Semua Fasilitas' : 'All Facilities'}
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(facilities || []).map((facility, idx: number) => {
            const facilityOption = FACILITY_OPTIONS.find((opt) => opt.key === facility.icon);
            const Icon = facilityOption?.icon;
            const label = locale === 'id' ? facility.label : facility.labelEn;
            return (
              <li key={idx} className="flex items-center gap-3">
                {Icon && <Icon className="w-4 h-4 text-brand-green flex-shrink-0" />}
                <span className="text-gray-text">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // Kamar (hanya untuk Hotel)
  if (activeTab === 'kamar' && isHotel) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-charcoal">
            {locale === 'id' ? 'Pilihan Tipe Kamar' : 'Room Type Options'}
          </h2>
          <a
            href={`/${locale}/properties/${propertySlug}/harga`}
            className="text-sm text-brand-green font-medium hover:underline"
          >
            {locale === 'id' ? 'Lihat Semua Harga →' : 'See All Prices →'}
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(availabilityData?.roomTypes || []).map((rt: any) => (
            <a
              key={rt.roomTypeId}
              href={`/${locale}/properties/${propertySlug}/harga/${rt.roomTypeId}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              {rt.images && rt.images.length > 0 && (
                <img src={rt.images[0]} alt={rt.roomTypeName} className="w-full h-40 object-cover" />
              )}
              <div className="p-3">
                <p className="font-bold text-charcoal mb-1">{rt.roomTypeName}</p>
                <p className="text-sm text-gold font-medium">
                  {locale === 'id' ? 'Mulai dari ' : 'Starting from '}
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(rt.priceWeekday)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Lokasi
  if (activeTab === 'lokasi') {
    return (
      <div>
        <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
          {locale === 'id' ? 'Lokasi' : 'Location'}
        </h2>
        <p className="text-gray-text mb-4">{displayLocation}</p>
        {(() => {
          const embedUrl = extractMapsEmbedUrl(mapsUrl);
          return embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-80 rounded-2xl border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi properti"
            />
          ) : (
            <div className="bg-gray-200 rounded-2xl h-80 flex items-center justify-center">
              <p className="text-gray-text">{locale === 'id' ? 'Peta belum tersedia' : 'Map not available'}</p>
            </div>
          );
        })()}
      </div>
    );
  }

  // Aturan
  if (activeTab === 'aturan') {
    return (
      <div>
        <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
          {locale === 'id' ? 'Aturan & Kebijakan' : 'Rules & Policy'}
        </h2>
        <ul className="space-y-2">
          {(displayRules || []).map((rule: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-gray-text">
              <span className="text-brand-green font-bold mt-0.5">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}