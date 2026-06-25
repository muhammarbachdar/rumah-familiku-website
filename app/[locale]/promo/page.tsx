// app/[locale]/promo/page.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchPromos } from '@/lib/api';
import { formatDate, getWhatsAppURL, isPromoActive } from '@/lib/utils/whatsapp';

export default function PromoPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromos()
      .then(data => {
        setPromos(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load promos:', err);
        setLoading(false);
      });
  }, []);

  // isPromoActive sudah di-fix menggunakan date-fns normalize
  const activePromos = promos.filter(
    (p) => p.active && isPromoActive(p.validUntil)
  );

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-brand-green text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-3xl md:text-4xl font-bold">
              {t('promo.title')}
            </h1>
            <p className="text-white/80 mt-2">
              {activePromos.length} {locale === 'id' ? 'promo aktif' : 'active promos'}
            </p>
          </div>
        </section>

        {/* Promos Grid */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            {activePromos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {activePromos.map((promo) => {
                  const displayTitle = locale === 'id' ? promo.titleId : promo.titleEn;
                  const displayDesc = locale === 'id' ? promo.descriptionId : promo.descriptionEn;

                  return (
                    <div
                      key={promo.id}
                      className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition group"
                    >
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
                        <img
                          src={promo.image}
                          alt={displayTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {promo.active && (
                          <div className="absolute top-4 right-4 bg-brand-green text-white px-4 py-1 rounded-full text-sm font-bold">
                            {t('promo.active')}
                          </div>
                        )}
                      </div>
                      <div className="bg-white p-6">
                        <h3 className="font-bold text-lg text-charcoal mb-2">
                          {displayTitle}
                        </h3>
                        <p className="text-gray-text text-sm mb-4 line-clamp-3">
                          {displayDesc}
                        </p>
                        <p className="text-xs text-gray-text mb-4">
                          {locale === 'id' ? 'Berlaku hingga' : 'Valid until'}:{' '}
                          <span className="font-bold text-charcoal">
                            {formatDate(promo.validUntil)}
                          </span>
                        </p>
                        <a
                          href={getWhatsAppURL(
                            locale === 'id'
                              ? `Saya ingin mengklaim promo: ${displayTitle}`
                              : `I want to claim this promo: ${displayTitle}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-brand-green text-white py-2 rounded-lg text-center font-medium hover:bg-green-hover transition"
                        >
                          {t('promo.claimVia')}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-2xl text-gray-text mb-4">
                  {t('promo.noPromo')}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}