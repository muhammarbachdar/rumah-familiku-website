'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const getNewPath = (newLocale: string) => {
    // Hapus locale yang ada dari pathname
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && (segments[0] === 'id' || segments[0] === 'en')) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    return '/' + segments.join('/');
  };

  return (
    <div className="flex gap-2">
      <Link
        href={getNewPath('en')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          locale === 'id'
            ? 'bg-brand-green text-white'
            : 'bg-cream text-charcoal hover:bg-gray-200'
        }`}
      >
        EN
      </Link>
      <Link
        href={getNewPath('id')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          locale === 'en'
            ? 'bg-brand-green text-white'
            : 'bg-cream text-charcoal hover:bg-gray-200'
        }`}
      >
        ID
      </Link>
    </div>
  );
}