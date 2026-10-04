// app/[locale]/faq/page.tsx
import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getFAQs, getSiteSettings } from '@/lib/data/content';
import { FAQAccordion } from './FAQAccordion';

export default async function FAQPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const [faqsData, siteData] = await Promise.all([getFAQs(), getSiteSettings()]);
  const faqs = faqsData || [];
  const whatsappNumber = siteData?.whatsappNumber || '628787695752';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-brand-green text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-3xl md:text-4xl font-bold">
              {locale === 'id' ? 'Pertanyaan Umum' : 'FAQ'}
            </h1>
            <p className="text-white/80 mt-2">
              {faqs.length} {locale === 'id' ? 'pertanyaan' : 'questions'}
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <FAQAccordion faqs={faqs} locale={locale} />
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 md:py-20 bg-cream">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl font-bold text-charcoal mb-4">
              {locale === 'id' ? 'Pertanyaan Lain?' : 'Still Have Questions?'}
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