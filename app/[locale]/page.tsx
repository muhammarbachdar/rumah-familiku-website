// app/[locale]/page.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';
import { fetchProperties, fetchPromos, fetchHome, fetchFAQs } from '@/lib/api';
import { getWhatsAppURL } from '@/lib/utils/whatsapp';
import Link from 'next/link';

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const [properties, setProperties] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [homeData, setHomeData] = useState<any>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchPromos(), fetchHome(), fetchFAQs()])
      .then(([props, promosData, home, faqsData]) => {
        setProperties(props || []);
        setPromos(promosData || []);
        setHomeData(home);
        setFaqs(faqsData || []);
        setLoading(false);
      })
      .catch(err => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, []);

  const featuredProperties = properties.slice(0, 6);
  const activePromos = promos.filter(p => p.active === true);
  const faqPreview = faqs.slice(0, 3);

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

  // Fallback jika homeData kosong
  const hero = homeData?.hero || {};
  const propertyTypes = homeData?.propertyTypes || [];
  const whyUs = homeData?.whyUs || [];
  const reviews = homeData?.reviews || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section - dinamis dari API */}
        <section className="relative h-96 md:h-[500px] bg-gradient-to-r from-brand-green to-green-hover overflow-hidden">
          <img
            src={hero.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&q=80'}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30" />

          <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center text-center text-white z-10">
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 max-w-2xl text-balance animate-fadeInUp">
              {locale === 'id' ? hero.titleId : hero.titleEn}
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-xl text-balance animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              {locale === 'id' ? hero.subtitleId : hero.subtitleEn}
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              {/* FIX 1: Tombol hero "Lihat Properti" - hapus hover:bg-yellow-300 */}
              <Link
                href={`/${locale}/properties`}
                className="btn-glow border-2 border-white text-white px-8 py-3 rounded-lg font-bold transition-premium inline-block shadow-lg hover:shadow-xl"
              >
                {locale === 'id' ? hero.ctaPrimaryId : hero.ctaPrimaryEn}
              </Link>
              <a
                href={getWhatsAppURL(locale === 'id' ? hero.ctaSecondaryId : hero.ctaSecondaryEn)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-green-800 transition-premium inline-block shadow-lg hover:shadow-xl"
              >
                {locale === 'id' ? hero.ctaSecondaryId : hero.ctaSecondaryEn}
              </a>
            </div>
          </div>
        </section>

        {/* Promo Section */}
        {activePromos.length > 0 && (
          <section className="py-12 bg-yellow-50">
            <div className="container mx-auto px-4">
              <h2 className="font-serif text-3xl font-bold text-center mb-8 text-charcoal">
                {locale === 'id' ? 'Promo Spesial' : 'Special Promos'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activePromos.map((promo) => (
                  <div key={promo.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <img src={promo.image} alt={promo.titleId} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h3 className="font-bold text-xl text-charcoal">
                        {locale === 'id' ? promo.titleId : promo.titleEn}
                      </h3>
                      <p className="text-gray-text mt-2">
                        {locale === 'id' ? promo.descriptionId : promo.descriptionEn}
                      </p>
                      <p className="text-sm text-gold mt-2">
                        {locale === 'id' ? `Berlaku hingga: ${promo.validUntil}` : `Valid until: ${promo.validUntil}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Property Types Section - dinamis dari API */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 animate-fadeInUp">
              {t('propertyTypes.title')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {propertyTypes.map((category: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/${locale}/properties?type=${category.labelId.toLowerCase() === 'hotel' ? 'hotel' : category.labelId.toLowerCase() === 'kos' ? 'kos' : category.labelId.toLowerCase() === 'apartemen' ? 'apartemen' : 'rumah'}`}
                  className="group cursor-pointer animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-premium border border-gray-100">
                    <img
                      src={category.icon}
                      alt={locale === 'id' ? category.labelId : category.labelEn}
                      className="w-full h-full object-cover group-hover:scale-125 transition-premium"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 group-hover:from-black/50 group-hover:to-black/70 transition-premium flex items-center justify-center">
                      {/* FIX 4: Property Types hover text - ganti group-hover:text-yellow-300 ke group-hover:text-gold */}
                      <p className="text-white font-bold text-lg text-center px-4 group-hover:text-gold transition-smooth">
                        {locale === 'id' ? category.labelId : category.labelEn}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 animate-fadeInUp">
              {t('featuredProperties.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredProperties.map((property, idx) => (
                <div key={property.id} className="animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
            <div className="text-center">
              {/* FIX 3: FAQ button - ganti bg-brand-green dan hover:bg-green-hover ke inline style */}
              <Link
                href={`/${locale}/properties`}
                className="inline-block btn-glow text-white px-8 py-3 rounded-lg font-bold transition-premium shadow-lg hover:shadow-xl"
                style={{ backgroundColor: 'var(--brand-green)' }}
              >
                {t('featuredProperties.viewDetails')} {t('common.next')}
              </Link>
            </div>
          </div>
        </section>

        {/* Why Us Section - dinamis dari API */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 animate-fadeInUp">
              {t('whyUs.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {whyUs.map((item: any, idx: number) => (
                <div
                  key={idx}
                  
                  className="card-hover bg-white border border-gray-100 rounded-2xl p-8 text-center hover:border-gold transition-premium animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="text-5xl mb-4 inline-block">{item.icon}</div>
                  <h3 className="font-serif text-xl font-bold text-gray-900 mb-3 group-hover:text-green-800 transition-smooth">
                    {locale === 'id' ? item.titleId : item.titleEn}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {locale === 'id' ? item.descId : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section - dinamis dari API */}
        <section className="py-12 md:py-20 bg-cream">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12 text-charcoal">
              {t('reviews.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-charcoal">{review.name}</p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-text text-sm">
                    {locale === 'id' ? review.textId : review.textEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Preview - dinamis dari API */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12 text-charcoal">
              {t('faqPreview.title')}
            </h2>
            <div className="max-w-2xl mx-auto space-y-4 mb-8">
              {faqPreview.map((faq: any) => (
                <div key={faq.id} className="bg-cream rounded-lg p-4 border-l-4" style={{ borderColor: 'var(--brand-green)' }}>
                  <p className="font-bold text-charcoal mb-2">
                    {locale === 'id' ? faq.questionId : faq.questionEn}
                  </p>
                  <p className="text-sm text-gray-text line-clamp-2">
                    {locale === 'id' ? faq.answerIdContent : faq.answerEnContent}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center">
              {/* FIX 3: FAQ button - ganti bg-brand-green dan hover:bg-green-hover ke inline style */}
              <Link
                href={`/${locale}/faq`}
                className="inline-block text-white px-8 py-3 rounded-lg font-bold transition hover:opacity-90"
                style={{ backgroundColor: 'var(--brand-green)' }}
              >
                {t('faqPreview.seeAll')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}