'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Share2, Images } from 'lucide-react';
import { formatPrice, getWhatsAppURL, getShareMessage } from '@/lib/utils/whatsapp';
import { FACILITY_OPTIONS } from '@/lib/constants/facilities';
import { extractMapsEmbedUrl } from '@/lib/maps';

const TABS = ['ringkasan', 'fasilitas', 'kamar', 'lokasi', 'aturan'] as const;
type Tab = typeof TABS[number];

interface HotelDetailProps {
  property: any;
  availabilityData: any;
  siteData: any;
  activePromo: any;
  displayPromoTitle: string | undefined;
  locale: string;
}

export function HotelDetail({
  property,
  availabilityData,
  siteData,
  activePromo,
  displayPromoTitle,
  locale,
}: HotelDetailProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<Tab>('ringkasan');
  const [showShare, setShowShare] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const displayName = locale === 'id' ? property.nameId : property.nameEn;
  const displayLocation = locale === 'id' ? property.locationId : property.locationEn;
  const displayDescription = locale === 'id' ? property.description : property.descriptionEn;
  const displayRules = locale === 'id' ? property.rules : property.rulesEn;

  const allPhotos: { url: string; category: string }[] =
    property.imagesCategorized && property.imagesCategorized.length > 0
      ? property.imagesCategorized
      : (property.images || []).map((url: string) => ({ url, category: '' }));

  const heroPhoto = allPhotos[0];
  const sidePhotos = allPhotos.slice(1, 5);

  const shareURL = typeof window !== 'undefined' ? window.location.href : '';
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareURL);
    alert(locale === 'id' ? 'Tautan disalin!' : 'Link copied!');
    setShowShare(false);
  };

  const minWeekday = property.roomTypes && property.roomTypes.length > 0
    ? Math.min(...property.roomTypes.map((rt: any) => rt.priceWeekday).filter((p: number) => p > 0))
    : 0;

  const tabLabels: Record<Tab, string> = {
    ringkasan: locale === 'id' ? 'Ringkasan' : 'Overview',
    fasilitas: locale === 'id' ? 'Fasilitas' : 'Facilities',
    kamar: locale === 'id' ? 'Kamar' : 'Rooms',
    lokasi: locale === 'id' ? 'Lokasi' : 'Location',
    aturan: locale === 'id' ? 'Aturan' : 'Rules',
  };

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        {/* ===== GALERI ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-2 mb-6">
          {heroPhoto && (
            <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden">
              <img src={heroPhoto.url} alt={displayName} className="w-full h-full object-cover" />
              {allPhotos.length > 1 && (
                <button
                  onClick={() => setShowAllPhotos(true)}
                  className="absolute bottom-4 left-4 bg-white/90 hover:bg-white text-charcoal text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <Images className="w-4 h-4" />
                  {locale === 'id' ? `Lihat semua foto (${allPhotos.length})` : `See all photos (${allPhotos.length})`}
                </button>
              )}
            </div>
          )}
          {sidePhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 h-72 md:h-96">
              {sidePhotos.map((photo, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden">
                  <img src={photo.url} alt={`${displayName} ${idx + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal semua foto, sederhana */}
        {showAllPhotos && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowAllPhotos(false)}>
            <div className="bg-white rounded-2xl max-w-4xl max-h-[85vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{locale === 'id' ? 'Semua Foto' : 'All Photos'}</h3>
                <button onClick={() => setShowAllPhotos(false)} className="text-gray-500 hover:text-charcoal text-xl">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allPhotos.map((photo, idx) => (
                  <img key={idx} src={photo.url} alt={`${displayName} ${idx + 1}`} className="w-full h-40 object-cover rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== KOLOM KIRI ===== */}
          <div className="lg:col-span-2">
            {/* Nama + Share */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-charcoal">{displayName}</h1>
              <button
                onClick={() => setShowShare(!showShare)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-green transition shrink-0 mt-1"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('propertyDetail.share')}</span>
              </button>
            </div>

            {showShare && (
              <div className="mb-3 flex flex-wrap gap-2">
                <a
                  href={getWhatsAppURL(getShareMessage(displayName, shareURL, locale), siteData?.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShare(false)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-green transition px-3 py-1.5 border border-gray-300 rounded-full"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t('propertyDetail.shareWhatsapp')}
                </a>
                <button
                  onClick={handleCopyLink}
                  className="text-sm text-gray-600 hover:text-brand-green transition px-3 py-1.5 border border-gray-300 rounded-full"
                >
                  {t('propertyDetail.copyLink')}
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-text mb-4">
              <span>📍</span>
              <span>{displayLocation}</span>
            </div>

            {/* Badge fasilitas ringkas (6 item) */}
            {property.facilities && property.facilities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                {property.facilities.slice(0, 6).map((facility: { label: string; labelEn: string; icon: string }, idx: number) => {
                  const facilityOption = FACILITY_OPTIONS.find((opt) => opt.key === facility.icon);
                  const Icon = facilityOption?.icon;
                  const label = locale === 'id' ? facility.label : facility.labelEn;
                  return (
                    <span key={idx} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs text-charcoal">
                      {Icon && <Icon className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />}
                      {label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* ===== TABS ===== */}
            <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab
                      ? 'text-brand-green border-b-2 border-brand-green'
                      : 'text-gray-500 hover:text-charcoal'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>

            {/* ===== TAB CONTENT: RINGKASAN ===== */}
            {activeTab === 'ringkasan' && (
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                  {locale === 'id' ? 'Tentang Properti' : 'About This Property'}
                </h2>
                <p className="text-gray-text leading-relaxed mb-6">{displayDescription}</p>

                <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                  {locale === 'id' ? 'Fasilitas Unggulan' : 'Featured Facilities'}
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {(property.facilities || []).slice(0, 6).map((facility: { label: string; labelEn: string; icon: string }, idx: number) => {
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
            )}

            {/* ===== TAB CONTENT: FASILITAS ===== */}
            {activeTab === 'fasilitas' && (
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
                  {locale === 'id' ? 'Semua Fasilitas' : 'All Facilities'}
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(property.facilities || []).map((facility: { label: string; labelEn: string; icon: string }, idx: number) => {
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
            )}

            {/* ===== TAB CONTENT: KAMAR ===== */}
            {activeTab === 'kamar' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-bold text-charcoal">
                    {locale === 'id' ? 'Pilihan Tipe Kamar' : 'Room Type Options'}
                  </h2>
                  <Link
                    href={`/${locale}/properties/${property.slug}/harga`}
                    className="text-sm text-brand-green font-medium hover:underline"
                  >
                    {locale === 'id' ? 'Lihat Semua Harga →' : 'See All Prices →'}
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(availabilityData?.roomTypes || []).map((rt: any) => (
                    <Link
                      key={rt.roomTypeId}
                      href={`/${locale}/properties/${property.slug}/harga/${rt.roomTypeId}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
                    >
                      {rt.images && rt.images.length > 0 && (
                        <img src={rt.images[0]} alt={rt.roomTypeName} className="w-full h-40 object-cover" />
                      )}
                      <div className="p-3">
                        <p className="font-bold text-charcoal mb-1">{rt.roomTypeName}</p>
                        <p className="text-sm text-gold font-medium">
                          {locale === 'id' ? 'Mulai dari ' : 'Starting from '}{formatPrice(rt.priceWeekday)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ===== TAB CONTENT: LOKASI ===== */}
            {activeTab === 'lokasi' && (
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal mb-3">
                  {locale === 'id' ? 'Lokasi' : 'Location'}
                </h2>
                <p className="text-gray-text mb-4">{displayLocation}</p>
                {(() => {
                  const embedUrl = extractMapsEmbedUrl(property.mapsUrl);
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
                      <p className="text-gray-text">Peta belum tersedia</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ===== TAB CONTENT: ATURAN ===== */}
            {activeTab === 'aturan' && (
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
            )}
          </div>

          {/* ===== SIDEBAR KANAN ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-20">
              {activePromo && (
                <div className="bg-gold/20 border border-gold rounded-lg p-3 mb-4">
                  <p className="text-xs font-bold text-gold-dark uppercase tracking-wide mb-1">
                    {locale === 'id' ? 'PROMO AKTIF' : 'ACTIVE PROMO'}
                  </p>
                  <p className="text-sm font-semibold text-charcoal">{displayPromoTitle}</p>
                </div>
              )}

              <p className="text-sm text-gray-text mb-1">
                {locale === 'id' ? 'Mulai dari' : 'Starting from'}
              </p>
              <p className="text-2xl font-bold text-gold mb-4">
                {formatPrice(minWeekday)}<span className="text-sm font-normal text-gray-text">/{locale === 'id' ? 'malam' : 'night'}</span>
              </p>

              <Link
                href={`/${locale}/properties/${property.slug}/harga`}
                className="block w-full bg-brand-green text-white py-3 rounded-lg font-bold text-center hover:bg-green-hover transition mb-6"
              >
                {locale === 'id' ? 'Lihat Harga & Ketersediaan' : 'View Prices & Availability'}
              </Link>

              {availabilityData?.roomTypes && availabilityData.roomTypes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-charcoal">
                      {locale === 'id' ? 'Tipe Kamar Populer' : 'Popular Room Types'}
                    </p>
                    <Link
                      href={`/${locale}/properties/${property.slug}/harga`}
                      className="text-xs text-brand-green hover:underline"
                    >
                      {locale === 'id' ? 'Lihat semua' : 'See all'}
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {availabilityData.roomTypes.slice(0, 4).map((rt: any) => (
                      <Link
                        key={rt.roomTypeId}
                        href={`/${locale}/properties/${property.slug}/harga/${rt.roomTypeId}`}
                        className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1.5 -mx-1.5 transition"
                      >
                        {rt.images && rt.images.length > 0 && (
                          <img src={rt.images[0]} alt={rt.roomTypeName} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-charcoal">{rt.roomTypeName}</p>
                          <p className="text-xs text-gray-text">
                            {locale === 'id' ? 'Mulai ' : 'From '}{formatPrice(rt.priceWeekday)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}