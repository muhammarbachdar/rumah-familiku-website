'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Property } from '@/lib/types';
import { formatPrice } from '@/lib/utils/whatsapp';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const displayName = locale === 'id' ? property.nameId : property.nameEn;
  const displayLocation = locale === 'id' ? property.locationId : property.locationEn;
  const displayCapacity = locale === 'id' 
    ? `max ${property.capacity.max} orang` 
    : `max ${property.capacity.max} people`;

  // Helper function untuk mendapatkan harga yang akan ditampilkan
  const getPriceDisplay = () => {
    // Untuk properti tipe Kos
    if (property.type === 'kos') {
      // Mode General (1 harga untuk semua)
      if (property.pricingMode === 'general' && property.monthlyPrice) {
        return {
          price: formatPrice(property.monthlyPrice),
          unit: locale === 'id' ? '/ bulan' : '/ month'
        };
      }
      // Mode WNI/WNA (default) - tampilkan harga WNI
      if (property.monthlyPricingWNI) {
        return {
          price: formatPrice(property.monthlyPricingWNI),
          unit: locale === 'id' ? '/ bulan' : '/ month'
        };
      }
      // Fallback jika tidak ada data harga
      return {
        price: formatPrice(0),
        unit: locale === 'id' ? '/ bulan' : '/ month'
      };
    }

    // Untuk properti non-Kos (Hotel, Apartemen, Rumah)
    if (property.pricing?.weekday) {
      return {
        price: formatPrice(property.pricing.weekday),
        unit: locale === 'id' ? '/ malam' : '/ night'
      };
    }

    // Fallback jika tidak ada data harga
    return {
      price: formatPrice(0),
      unit: locale === 'id' ? '/ malam' : '/ night'
    };
  };

  const priceDisplay = getPriceDisplay();

  return (
    <Link href={`/${locale}/properties/${property.slug}`}>
      <div className="card-hover bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-premium cursor-pointer group h-full flex flex-col border border-gray-100">
        {/* Image Container */}
        <div className="relative h-48 md:h-64 bg-gray-200 overflow-hidden">
          <img
            src={property.image}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-110 transition-premium"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
          
          {/* Type Badge */}
          <div className="absolute top-4 right-4 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg transition-premium"style={{ backgroundColor: 'var(--brand-green)' }}>
            {property.type === 'hotel' && t('propertyTypes.hotel')}
            {property.type === 'kos' && t('propertyTypes.kos')}
            {property.type === 'apartemen' && t('propertyTypes.apartemen')}
            {property.type === 'rumah' && t('propertyTypes.rumah')}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-800 transition-smooth">
            {displayName}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
            <span className="text-lg">📍</span>
            <span className="line-clamp-1 hover:text-green-700 transition-smooth">{displayLocation}</span>
          </div>

          {/* Capacity */}
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
            <span className="text-lg">👥</span>
            <span>{displayCapacity}</span>
          </div>

          {/* Price */}
          <div className="mb-4 flex-1">
            <p className="text-sm text-gray-500 mb-1">
              {property.type === 'kos' 
                ? (locale === 'id' ? 'Mulai dari' : 'From')
                : t('featuredProperties.from')}
            </p>
            <p className="font-bold text-xl" style={{ color: 'var(--gold)' }}>
              {priceDisplay.price}
            </p>
            <p className="text-xs text-gray-500">
              {priceDisplay.unit}
            </p>
          </div>

          {/* CTA Button */}
          <button className="w-full btn-glow text-white py-2.5 rounded-lg font-semibold transition-premium shadow-md hover:shadow-lg" style={{ backgroundColor: 'var(--brand-green)' }}>
            {t('featuredProperties.viewDetails')}
          </button>
        </div>
      </div>
    </Link>
  );
}