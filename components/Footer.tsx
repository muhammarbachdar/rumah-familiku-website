'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { fetchSite } from '@/lib/api';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations(); // untuk menu navigasi
  const locale = useLocale();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSite()
      .then(data => setSite(data))
      .catch(err => console.error('Failed to load site data:', err))
      .finally(() => setLoading(false));
  }, []);

  // Fallback data jika fetch gagal atau masih loading
  const whatsappNumber = site?.whatsappNumber || '628787695752';
  const email = site?.email || 'rumahfamiliku@gmail.com';
  const instagramUrl = site?.instagramUrl || 'https://instagram.com';
  const tagline = site?.footerTagline || t('tagline');
  const copyright = site?.copyrightText || t('copyright');
  const siteName = site?.siteName || 'Rumah Familiku';
  const logoText = site?.logoText || 'RF';

  // Menu navigasi: gunakan site.navLinks jika ada, fallback ke hardcoded
  const navLinks = site?.navLinks && site.navLinks.length > 0 
    ? site.navLinks 
    : [
        { label: 'nav.home', href: '/' },
        { label: 'nav.properties', href: '/properties' },
        { label: 'nav.promo', href: '/promo' },
        { label: 'nav.faq', href: '/faq' }
      ];

  if (loading) {
    return null;
  }

  return (
    <footer className="bg-brand-green text-white py-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/30 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/10 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="animate-fadeInUp">
            <div className="flex items-center gap-2 mb-3 group">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-green font-bold group-hover:bg-gold transition-premium text-lg">
                {logoText}
              </div>
              <span className="font-serif text-xl font-bold group-hover:text-gold transition-smooth">{siteName}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{tagline}</p>
          </div>

          {/* Contact */}
          <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h4 className="font-bold mb-4 text-white">{t('contact')}</h4>
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-white font-semibold">Email:</span>
                <br />
                <a href={`mailto:${email}`} className="link-underline text-gray-300">{email}</a>
              </p>
              <p>
                <span className="text-white font-semibold">WhatsApp:</span>
                <br />
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition">
                  +{whatsappNumber}
                </a>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold mb-4">Menu</h4>
            <div className="space-y-2 text-sm">
              {navLinks.map((link: any) => (
                <Link
                  key={link.href}
                  href={`/${locale}${link.href}`}
                  className="text-gray-400 hover:text-white transition block"
                >
                  {tNav(link.label)}
                </Link>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-4">{t('follow')}</h4>
            <div className="space-y-2 text-sm">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gold transition block">Instagram</a>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gold transition block">WhatsApp</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-gray-400 text-sm">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}