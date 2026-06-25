// app/[locale]/about/page.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchAbout } from '@/lib/api';
import { getWhatsAppURL } from '@/lib/utils/whatsapp';

export default function AboutPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbout()
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load about data:', err);
        setLoading(false);
      });
  }, []);

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

  // Fallback jika content kosong
  const mission = content?.mission || t('about.mission');
  const missionEn = content?.missionEn || '';
  const ctaTitle = locale === 'id' ? content?.ctaTitle : content?.ctaTitleEn;
  const ctaDesc = locale === 'id' ? content?.ctaDesc : content?.ctaDescEn;
  const values = content?.values || [];
  const whyChooseUs = content?.whyChooseUs || [];

  const displayMission = locale === 'id' ? mission : missionEn;
  const displayValues = values.map((v: any) => ({
    title: locale === 'id' ? v.title : v.titleEn,
    desc: locale === 'id' ? v.desc : v.descEn,
  }));
  const displayWhyChooseUs = whyChooseUs.map((item: any) => ({
    icon: item.icon,
    title: locale === 'id' ? item.titleId : item.titleEn,
    desc: locale === 'id' ? item.descId : item.descEn,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-r from-brand-green to-green-hover text-white py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {t('about.title')}
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-white/90">
              {t('about.description')}
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-3xl font-bold text-charcoal mb-6">
                {t('about.mission')}
              </h2>
              <p className="text-gray-text leading-relaxed mb-8">
                {displayMission}
              </p>

              <h2 className="font-serif text-3xl font-bold text-charcoal mb-6">
                {t('about.values')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayValues.map((value: any, idx: number) => (
                  <div key={idx} className="bg-cream rounded-xl p-6 border-l-4 border-brand-green">
                    <h3 className="font-bold text-lg text-charcoal mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-text">{value.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - dinamis dari API */}
        <section className="py-12 md:py-20 bg-cream">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl font-bold text-center text-charcoal mb-12">
              {t('whyUs.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayWhyChooseUs.map((item: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-charcoal mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-text">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20 bg-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
              {ctaTitle || t('about.ctaTitle')}
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
              {ctaDesc || t('about.ctaDesc')}
            </p>
            <a
              href={getWhatsAppURL(
                locale === 'id'
                  ? 'Saya ingin mengetahui lebih lanjut tentang Rumah Familiku Syariah'
                  : 'I want to know more about Rumah Familiku Syariah'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold text-charcoal px-8 py-4 rounded-lg font-bold hover:bg-yellow-500 transition"
            >
              {locale === 'id' ? 'Hubungi Kami via WhatsApp' : 'Contact Us on WhatsApp'}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}