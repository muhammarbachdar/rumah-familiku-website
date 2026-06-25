// app/[locale]/faq/page.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchFAQs, fetchSite } from '@/lib/api';

export default function FAQPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('628787695752');

  useEffect(() => {
    Promise.all([fetchFAQs(), fetchSite()])
      .then(([faqsData, siteData]) => {
        setFaqs(faqsData || []);
        if (siteData?.whatsappNumber) {
          setWhatsappNumber(siteData.whatsappNumber);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
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

  const categories = Array.from(
    new Set(faqs.map((f: any) => (locale === 'id' ? f.categoryId : f.categoryEn)))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-brand-green text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-3xl md:text-4xl font-bold">
              {t('faq.title')}
            </h1>
            <p className="text-white/80 mt-2">
              {faqs.length} {locale === 'id' ? 'pertanyaan' : 'questions'}
            </p>
          </div>
        </section>

        {/* FAQs by Category */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            {categories.map((category) => {
              const categoryFaqs = faqs.filter((f: any) =>
                locale === 'id'
                  ? f.categoryId === category
                  : f.categoryEn === category
              );

              return (
                <div key={category} className="mb-12">
                  <h2 className="font-serif text-2xl font-bold text-charcoal mb-6">
                    {category}
                  </h2>

                  <div className="space-y-4">
                    {categoryFaqs.map((faq: any) => {
                      const question =
                        locale === 'id' ? faq.questionId : faq.questionEn;
                      const answer =
                        locale === 'id'
                          ? faq.answerIdContent
                          : faq.answerEnContent;
                      const isExpanded = expandedId === faq.id;

                      return (
                        <div
                          key={faq.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : faq.id)
                            }
                            className="w-full text-left px-6 py-4 bg-cream hover:bg-gray-200 transition flex items-center justify-between font-medium text-charcoal"
                          >
                            <span>{question}</span>
                            <span
                              className={`text-xl transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            >
                              ▼
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="px-6 py-4 bg-white border-t border-gray-200">
                              <p className="text-gray-text leading-relaxed">
                                {answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 md:py-20 bg-cream">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl font-bold text-charcoal mb-4">
              {locale === 'id'
                ? 'Pertanyaan Lain?'
                : 'Still Have Questions?'}
            </h2>
            <p className="text-gray-text mb-6 max-w-xl mx-auto">
              {locale === 'id'
                ? 'Tim kami siap membantu Anda. Hubungi kami via WhatsApp untuk bantuan lebih lanjut.'
                : 'Our team is ready to help you. Contact us via WhatsApp for further assistance.'}
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                locale === 'id'
                  ? 'Halo, saya punya pertanyaan tentang Rumah Familiku'
                  : 'Hello, I have a question about Rumah Familiku'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-brand-green text-white px-8 py-3 rounded-lg font-bold hover:bg-green-hover transition"
            >
              {locale === 'id' ? 'Hubungi via WhatsApp' : 'Contact via WhatsApp'}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}