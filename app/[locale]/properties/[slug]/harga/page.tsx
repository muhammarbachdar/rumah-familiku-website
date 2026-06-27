'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchProperties, fetchAvailability } from '@/lib/api';
import { formatPrice } from '@/lib/utils/whatsapp';
import Link from 'next/link';

export default function PropertyPricingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [property, setProperty] = useState<any>(null);
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties()
      .then((propertiesData) => {
        const found = propertiesData.find((p: any) => p.slug === slug);
        if (!found) {
          setLoading(false);
          return;
        }
        setProperty(found);

        // Non-hotel: redirect balik ke halaman detail, gak perlu halaman harga
        if (found.type !== 'hotel') {
          router.replace(`/${locale}/properties/${slug}`);
          return;
        }

        fetchAvailability(found.id)
          .then((data) => {
            setAvailabilityData(data);
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
  }, [slug, locale, router]);

  const handlePilih = (roomTypeId: string) => {
    router.push(`/${locale}/properties/${slug}/harga/${roomTypeId}`);
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

  if (!property) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-2xl text-gray-text">Property not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = locale === 'id' ? property.nameId : property.nameEn;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="bg-brand-green text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <Link href={`/${locale}/properties/${slug}`} className="text-white/80 hover:text-white text-sm mb-2 inline-block">
              ← {displayName}
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">
              {locale === 'id' ? 'Daftar Harga' : 'Price List'}
            </h1>
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {availabilityData?.roomTypes && availabilityData.roomTypes.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-cream">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">
                          {locale === 'id' ? 'Tipe Kamar' : 'Room Type'}
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">
                          {locale === 'id' ? 'Fasilitas Utama' : 'Main Facilities'}
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">
                          {locale === 'id' ? 'Kapasitas' : 'Capacity'}
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">
                          {locale === 'id' ? 'Harga' : 'Price'}
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {availabilityData.roomTypes.map((rt: any) => (
                        <tr key={rt.roomTypeId} className="border-t border-gray-100">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {rt.images && rt.images.length > 0 && (
                                <img
                                  src={rt.images[0]}
                                  alt={rt.roomTypeName}
                                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <span className="font-medium text-charcoal">{rt.roomTypeName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1.5">
                              {property?.facilities?.slice(0, 3).map((f: { label: string; labelEn: string; icon: string }, idx: number) => (
                                <span key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {locale === 'id' ? f.label : f.labelEn}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {rt.capacity || 2} {locale === 'id' ? 'orang' : 'people'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-gold">{formatPrice(rt.priceWeekday)}</p>
                            <p className="text-xs text-gray-400">
                              {locale === 'id' ? 'Weekend' : 'Weekend'}: {formatPrice(rt.priceWeekend)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handlePilih(rt.roomTypeId)}
                              className="bg-brand-green text-white px-4 py-1.5 rounded-lg font-medium hover:bg-green-hover transition whitespace-nowrap"
                            >
                              {locale === 'id' ? 'Pilih' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-text">
                  {locale === 'id' ? 'Belum ada tipe kamar tersedia.' : 'No room types available yet.'}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}