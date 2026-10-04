// components/property-detail/PropertyDetailWrapper.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PropertyGallery } from './PropertyGallery';
import { PropertyShare } from './PropertyShare';
import { PropertyTabs } from './PropertyTabs';
import { PropertyTabContent } from './PropertyTabContent';
import { PropertySidebar } from './PropertySidebar';
import { PropertyAvailability } from './PropertyAvailability';
import { FACILITY_OPTIONS } from '@/lib/constants/facilities';

const COMMON_TABS = ['ringkasan', 'fasilitas', 'lokasi', 'aturan'] as const;
const HOTEL_TABS = ['ringkasan', 'fasilitas', 'kamar', 'lokasi', 'aturan'] as const;

type Tab = typeof COMMON_TABS[number] | typeof HOTEL_TABS[number];

interface PropertyDetailWrapperProps {
  property: any;
  availabilityData: any;
  availabilityLoading: boolean;
  bookedDates: string[];
  siteData: any;
  activePromo: any;
  displayPromoTitle: string | undefined;
  locale: string;
  initialUnitId?: string | null;
}

export function PropertyDetailWrapper({
  property,
  availabilityData,
  availabilityLoading,
  bookedDates,
  siteData,
  activePromo,
  displayPromoTitle,
  locale,
  initialUnitId,
}: PropertyDetailWrapperProps) {
  const t = useTranslations();

  const isHotel = property.type === 'hotel';
  const isKos = property.type === 'kos';
  const tabs = isHotel ? HOTEL_TABS : COMMON_TABS;
  type TabType = typeof tabs[number];

  const [activeTab, setActiveTab] = useState<TabType>('ringkasan');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(initialUnitId || null);

  const displayName = locale === 'id' ? property.nameId : property.nameEn;
  const displayLocation = locale === 'id' ? property.locationId : property.locationEn;
  const displayDescription = locale === 'id' ? property.description : property.descriptionEn;
  const displayRules = locale === 'id' ? property.rules : property.rulesEn;

  const tabLabels: Record<string, string> = {
    ringkasan: locale === 'id' ? 'Ringkasan' : 'Overview',
    fasilitas: locale === 'id' ? 'Fasilitas' : 'Facilities',
    kamar: locale === 'id' ? 'Kamar' : 'Rooms',
    lokasi: locale === 'id' ? 'Lokasi' : 'Location',
    aturan: locale === 'id' ? 'Aturan' : 'Rules',
  };

  // Hotel: min weekday price
  const minWeekday = property.roomTypes && property.roomTypes.length > 0
    ? Math.min(...property.roomTypes.map((rt: any) => rt.priceWeekday).filter((p: number) => p > 0))
    : 0;

  // Kos: unit selector
  const units = availabilityData?.units || [];
  const currentUnitId = selectedUnitId || (units.length > 0 ? units[0]?.unitId : null);

  // ✅ FIX: Tambah tipe untuk parameter item dan idx
  const facilityBadges = (property.facilities || []).slice(0, 6).map((facility: any, idx: number) => {
    const facilityOption = FACILITY_OPTIONS.find((opt) => opt.key === facility.icon);
    const Icon = facilityOption?.icon;
    const label = locale === 'id' ? facility.label : facility.labelEn;
    return { Icon, label, key: facility.icon };
  });

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        {/* ===== GALERI ===== */}
        <PropertyGallery
          images={property.imagesCategorized || []}
          displayName={displayName}
          locale={locale}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== KOLOM KIRI ===== */}
          <div className="lg:col-span-2">
            {/* Nama + Share */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-charcoal">
                {displayName}
              </h1>
              <PropertyShare
                displayName={displayName}
                siteData={siteData}
                locale={locale}
              />
            </div>

            <div className="flex items-center gap-2 text-gray-text mb-4">
              <span>📍</span>
              <span>{displayLocation}</span>
            </div>

            {/* Facilities Badges */}
            {facilityBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                {facilityBadges.map((item: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs text-charcoal"
                  >
                    {item.Icon && <item.Icon className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />}
                    {item.label}
                  </span>
                ))}
              </div>
            )}

            {/* ===== TABS ===== */}
            <PropertyTabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab as (tab: string) => void}
              tabLabels={tabLabels}
            />

            {/* ===== TAB CONTENT ===== */}
            <PropertyTabContent
              activeTab={activeTab}
              tabs={tabs}
              displayDescription={displayDescription}
              displayRules={displayRules}
              facilities={property.facilities || []}
              displayLocation={displayLocation}
              mapsUrl={property.mapsUrl}
              locale={locale}
              roomTypes={availabilityData?.roomTypes}
              propertySlug={property.slug}
              availabilityData={availabilityData}
            />

            {/* ===== AVAILABILITY (kecuali Hotel) ===== */}
            {!isHotel && (
              <PropertyAvailability
                bookedDates={bookedDates}
                availabilityLoading={availabilityLoading}
                locale={locale}
              />
            )}
          </div>

          {/* ===== SIDEBAR KANAN ===== */}
          <div className="lg:col-span-1">
            {/* Unit selector untuk Kos */}
            {isKos && units.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'id' ? 'Pilih Kamar' : 'Select Room'}
                </label>
                <select
                  value={currentUnitId || ''}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {units.map((u: any) => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.unitName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <PropertySidebar
              property={property}
              activePromo={activePromo}
              displayPromoTitle={displayPromoTitle}
              siteData={siteData}
              locale={locale}
              isKos={isKos}
              minWeekday={minWeekday}
              propertySlug={property.slug}
            />
          </div>
        </div>
      </div>
    </section>
  );
}