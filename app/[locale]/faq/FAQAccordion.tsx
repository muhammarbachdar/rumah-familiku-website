'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function FAQAccordion({ faqs, locale }: { faqs: any[]; locale: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = useTranslations();

  const categories = Array.from(
    new Set(faqs.map((f: any) => (locale === 'id' ? f.categoryId : f.categoryEn)))
  );

  return (
    <>
      {categories.map((category) => {
        const categoryFaqs = faqs.filter((f: any) =>
          locale === 'id' ? f.categoryId === category : f.categoryEn === category
        );
        return (
          <div key={category} className="mb-12">
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-6">{category}</h2>
            <div className="space-y-4">
              {categoryFaqs.map((faq: any) => {
                const question = locale === 'id' ? faq.questionId : faq.questionEn;
                const answer = locale === 'id' ? faq.answerIdContent : faq.answerEnContent;
                const isExpanded = expandedId === faq.id;
                return (
                  <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                      className="w-full text-left px-6 py-4 bg-cream hover:bg-gray-200 transition flex items-center justify-between font-medium text-charcoal"
                    >
                      <span>{question}</span>
                      <span className={`text-xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isExpanded && (
                      <div className="px-6 py-4 bg-white border-t border-gray-200">
                        <p className="text-gray-text leading-relaxed">{answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}