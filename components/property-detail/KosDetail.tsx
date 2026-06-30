'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Share2, Images } from 'lucide-react';
import { formatPrice, getWhatsAppURL, generateBookingMessage, getShareMessage } from '@/lib/utils/whatsapp';
import { FACILITY_OPTIONS } from '@/lib/constants/facilities';
import { extractMapsEmbedUrl } from '@/lib/maps';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';

const TABS = ['ringkasan', 'fasilitas', 'lokasi', 'aturan'] as const;
type Tab = typeof TABS[number];

interface KosDetailProps {
  property: any;
  availabilityData: any;
  availabilityLoading: boolean;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string) => void;
  bookedDates: string[];
  siteData: any;
  activePromo: any;
  displayPromoTitle: string | undefined;
  locale: string;
}

export function KosDetail({
  property,
  availabilityData,
  availabilityLoading,
  selectedUnitId,
  setSelectedUnitId,
  bookedDates,
  siteData,
  activePromo,
  displayPromoTitle,
  locale,
}: KosDetailProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<Tab>('ringkasan');
  const [showShare, setShowShare] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showAvailability, setShowAvailability] = useState(false);

  const displayName = locale === 'id' ? property.nameId : property.nameEn;
  const displayLocation = locale === 'id' ? property.locationId : property.locationEn;
  const displayDescription = locale === 'id' ? property.description : property.descriptionEn;
  const displayRules = locale === 'id' ? property.rules : property.rulesEn;

  const bookingMessage = generateBookingMessage(displayName, property.capacity?.max || 4, locale);
  const bookingURL = getWhatsAppURL(bookingMessage, siteData?.whatsappNumber);
  const shareURL = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareURL);
    alert(locale === 'id' ? 'Tautan disalin!' : 'Link copied!');
    setShowShare(false);
  };

  const allPhotos: { url: string; category: string }[] = property.imagesCategorized || [];
  const activePhoto = allPhotos[activePhotoIndex];
  const goToPrevPhoto = () => setActivePhotoIndex((i) => (i === 0 ? allPhotos.length - 1 : i - 1));
  const goToNextPhoto = () => setActivePhotoIndex((i) => (i === allPhotos.length - 1 ? 0 : i + 1));

  const tabLabels: Record<Tab, string> = {
    ringkasan: locale === 'id' ? 'Ringkasan' : 'Overview',
    fasilitas: locale === 'id' ? 'Fasilitas' : 'Facilities',
    lokasi: locale === 'id' ? 'Lokasi' : 'Location',
    aturan: locale === 'id' ? 'Aturan' : 'Rules',
  };

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        {/* ===== GALERI ===== */}
        {activePhoto && (
          <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-6">
            <img src={activePhoto.url} alt={displayName} className="w-full h-full object-cover" />
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={goToPrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-charcoal rounded-full w-9 h-9 flex items-center justify-center text-xl transition"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  onClick={goToNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-charcoal rounded-full w-9 h-9 flex items-center justify-center text-xl transition"
                  aria-label="Next photo"
                >
                  ›
                </button>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {activePhotoIndex + 1} / {allPhotos.length}
                </div>                
              </>
            )}
          </div>
        )}

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

              {property.pricingMode === 'general' && (
                <div className="mb-6">
                  <p className="text-sm text-gray-text mb-1">{locale === 'id' ? 'Harga per Bulan' : 'Monthly Price'}</p>
                  <p className="text-gold text-2xl font-bold">{formatPrice(property.monthlyPrice || 0)}</p>
                </div>
              )}
              {(property.pricingMode === 'wni-wna' || !property.pricingMode) && (
                <div className="mb-6">
                  <p className="text-sm text-gray-text mb-1">{t('propertyDetail.monthlyWNI')}</p>
                  <p className="text-gold text-2xl font-bold mb-2">{formatPrice(property.monthlyPricingWNI)}</p>
                  <p className="text-sm text-gray-text mb-1">{t('propertyDetail.monthlyWNA')}</p>
                  <p className="text-gold text-2xl font-bold">{formatPrice(property.monthlyPricingWNA)}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-text mb-1">{t('propertyDetail.capacity')}</p>
                <p className="font-bold text-charcoal">
                  {property.capacity.min}-{property.capacity.max} {locale === 'id' ? 'orang' : 'people'}
                </p>
              </div>

              {property.extraCharge && (
                <div className="bg-cream rounded-lg p-4 mb-6 border border-gray-200">
                  <p className="text-xs text-gray-text mb-1">{t('propertyDetail.extraCharge')}</p>
                  <p className="font-bold text-charcoal">
                    {formatPrice(property.extraCharge.amount)}{' '}
                    {property.extraCharge.unit === 'per_person' ? t('propertyDetail.perPerson') : '/ grup'}
                  </p>
                </div>
              )}

              <a
                href={bookingURL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-brand-green text-white py-3 rounded-lg font-bold text-center hover:bg-green-hover transition"
              >
                {t('propertyDetail.bookWhatsapp')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}