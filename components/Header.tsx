'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { fetchSite } from '@/lib/api';
import { useEffect, useState } from 'react';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchSite()
      .then(data => setSite(data))
      .catch(err => console.error('Failed to load site data:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <header className="sticky top-0 z-50 bg-brand-green text-white shadow-lg py-4">Loading...</header>;
  }

  const whatsappNumber = site?.whatsappNumber || '628787695752';
  const siteName = site?.siteName || 'Rumah Familiku';
  const logoSymbol = site?.logoText || 'RF';
  const navLinks = site?.navLinks || [
    { label: 'nav.home', href: '/' },
    { label: 'nav.properties', href: '/properties' },
    { label: 'nav.promo', href: '/promo' },
    { label: 'nav.about', href: '/about' },
    { label: 'nav.faq', href: '/faq' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-green text-white shadow-lg">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="font-serif text-2xl font-bold tracking-tight"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green font-bold">
              {logoSymbol}
            </div>
            <span>{siteName}</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link: any) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className="link-underline text-white hover:text-gold transition-smooth text-sm font-medium"
            >
              {t(link.label)}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline btn-glow bg-white text-brand-green px-6 py-2.5 rounded-lg font-semibold hover:bg-gold hover:text-gray-800 transition-premium shadow-md hover:shadow-lg"
          >
            WhatsApp
          </a>

          {/* Hamburger Menu Button (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-green border-t border-green-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link: any) => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-gold transition-smooth text-base font-medium py-2"
              >
                {t(link.label)}
              </Link>
            ))}
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-glow bg-white text-brand-green px-6 py-2.5 rounded-lg font-semibold hover:bg-gold hover:text-gray-800 transition-premium shadow-md text-center"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}