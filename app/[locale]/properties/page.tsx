// app/[locale]/properties/page.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';
import { fetchProperties } from '@/lib/api';

export default function PropertiesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get('type');
  const validTypes = ['hotel', 'kos', 'apartemen', 'rumah'];

  const initialType =
    typeParam && validTypes.includes(typeParam)
      ? typeParam
      : null;

  const [selectedType, setSelectedType] = useState<string | null>(initialType);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties()
      .then((data) => {
        setProperties(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load properties:', err);
        setLoading(false);
      });
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-text">Loading properties...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-brand-green text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
              {t('propertyTypes.title')}
            </h1>
            <p className="text-white/80">
              {filteredProperties.length} {locale === 'id' ? 'properti tersedia' : 'properties available'}
            </p>
          </div>
        </section>

        {/* Filter Section */}
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

        {/* Properties Grid */}
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
      </main>

      <Footer />
    </div>
  );
}