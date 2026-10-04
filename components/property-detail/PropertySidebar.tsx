// components/property-detail/PropertySidebar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { formatPrice, getWhatsAppURL, generateBookingMessage } from '@/lib/utils/whatsapp';

interface PropertySidebarProps {
  property: any;
  activePromo: any;
  displayPromoTitle: string | undefined;
  siteData: any;
  locale: string;
  isKos?: boolean;
  // Hotel specific
  minWeekday?: number;
  propertySlug?: string;
}

export function PropertySidebar({
  property,
  activePromo,
  displayPromoTitle,
  siteData,
  locale,
  isKos = false,
  minWeekday = 0,
  propertySlug,
}: PropertySidebarProps) {
  const t = useTranslations();

  const displayName = locale === 'id' ? property.nameId : property.nameEn;
  const bookingMessage = generateBookingMessage(displayName, property.capacity?.max || 4, locale);
  const bookingURL = getWhatsAppURL(bookingMessage, siteData?.whatsappNumber);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-20">
      {/* Promo */}
      {activePromo && (
        <div className="bg-gold/20 border border-gold rounded-lg p-3 mb-4">
          <p className="text-xs font-bold text-gold-dark uppercase tracking-wide mb-1">
            {locale === 'id' ? 'PROMO AKTIF' : 'ACTIVE PROMO'}
          </p>
          <p className="text-sm font-semibold text-charcoal">{displayPromoTitle}</p>
        </div>
      )}

      {/* Pricing */}
      {isKos ? (
        // Kos pricing
        <>
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
        </>
      ) : property.type === 'hotel' ? (
        // Hotel pricing
        <div className="mb-6">
          <p className="text-sm text-gray-text mb-1">{locale === 'id' ? 'Mulai dari' : 'Starting from'}</p>
          <p className="text-2xl font-bold text-gold mb-4">
            {formatPrice(minWeekday)}
            <span className="text-sm font-normal text-gray-text">
              /{locale === 'id' ? 'malam' : 'night'}
            </span>
          </p>
          {propertySlug && (
            <a
              href={`/${locale}/properties/${propertySlug}/harga`}
              className="block w-full bg-brand-green text-white py-3 rounded-lg font-bold text-center hover:bg-green-hover transition mb-4"
            >
              {locale === 'id' ? 'Lihat Harga & Ketersediaan' : 'View Prices & Availability'}
            </a>
          )}
        </div>
      ) : (
        // Villa / Apartemen pricing
        property.pricing && (
          <div className="mb-6">
            <p className="text-sm text-gray-text mb-1">{t('propertyDetail.weekday')}</p>
            <p className="text-gold text-2xl font-bold mb-4">{formatPrice(property.pricing.weekday)}</p>
            <p className="text-sm text-gray-text mb-1">{t('propertyDetail.weekend')}</p>
            <p className="text-gold text-2xl font-bold">{formatPrice(property.pricing.weekend)}</p>
          </div>
        )
      )}

      {/* Capacity */}
      <div className="mb-4">
        <p className="text-sm text-gray-text mb-1">{t('propertyDetail.capacity')}</p>
        <p className="font-bold text-charcoal">
          {property.capacity.min}-{property.capacity.max} {locale === 'id' ? 'orang' : 'people'}
        </p>
      </div>

      {/* Extra Charge */}
      {property.extraCharge && (
        <div className="bg-cream rounded-lg p-4 mb-6 border border-gray-200">
          <p className="text-xs text-gray-text mb-1">{t('propertyDetail.extraCharge')}</p>
          <p className="font-bold text-charcoal">
            {formatPrice(property.extraCharge.amount)}{' '}
            {property.extraCharge.unit === 'per_person' ? t('propertyDetail.perPerson') : '/ grup'}
          </p>
        </div>
      )}

      {/* Booking Button */}
      <a
        href={bookingURL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-brand-green text-white py-3 rounded-lg font-bold text-center hover:bg-green-hover transition"
      >
        {t('propertyDetail.bookWhatsapp')}
      </a>
    </div>
  );
}