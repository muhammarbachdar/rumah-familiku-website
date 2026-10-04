'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PropertyCard } from '@/components/PropertyCard';

export function PropertyFilter({
  properties,
  locale,
  initialType,
}: {
  properties: any[];
  locale: string;
  initialType: string | null;
}) {
  const t = useTranslations();
  const [selectedType, setSelectedType] = useState<string | null>(initialType);

  const filteredProperties = selectedType
    ? properties.filter((p) => p.type === selectedType)
    : properties;

  const propertyTypes = [
    { value: null, label: locale === 'id' ? 'Semua' : 'All' },
    { value: 'hotel', label: t('propertyTypes.hotel') },
    { value: 'kos', label: t('propertyTypes.kos') },
    { value: 'apartemen', label: t('propertyTypes.apartemen') },
    { value: 'rumah', label: t('propertyTypes.rumah') },
  ];

  return (
    <>
      <section className="bg-cream py-6 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type.value || 'all'}
                onClick={() => setSelectedType(type.value as string | null)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedType === type.value
                    ? 'bg-brand-green text-white'
                    : 'bg-white text-charcoal border border-gray-300 hover:border-brand-green'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-text mb-4">
                {locale === 'id' ? 'Tidak ada properti' : 'No properties found'}
              </p>
              <button
                onClick={() => setSelectedType(null)}
                className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-green-hover transition"
              >
                {locale === 'id' ? 'Lihat Semua' : 'View All'}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}