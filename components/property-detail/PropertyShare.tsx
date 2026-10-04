// components/property-detail/PropertyShare.tsx
'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { getWhatsAppURL, getShareMessage } from '@/lib/utils/whatsapp';

interface PropertyShareProps {
  displayName: string;
  siteData: any;
  locale: string;
}

export function PropertyShare({ displayName, siteData, locale }: PropertyShareProps) {
  const [showShare, setShowShare] = useState(false);

  const shareURL = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareURL);
    alert(locale === 'id' ? 'Tautan disalin!' : 'Link copied!');
    setShowShare(false);
  };

  return (
    <>
      <button
        onClick={() => setShowShare(!showShare)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-green transition shrink-0 mt-1"
        aria-label={locale === 'id' ? 'Bagikan' : 'Share'}
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">{locale === 'id' ? 'Bagikan' : 'Share'}</span>
      </button>

      {showShare && (
        <div className="mb-3 flex flex-wrap gap-2">
          <a
            href={getWhatsAppURL(
              getShareMessage(displayName, shareURL, locale),
              siteData?.whatsappNumber
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowShare(false)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-green transition px-3 py-1.5 border border-gray-300 rounded-full"
          >
            <Share2 className="w-3.5 h-3.5" />
            {locale === 'id' ? 'WhatsApp' : 'WhatsApp'}
          </a>
          <button
            onClick={handleCopyLink}
            className="text-sm text-gray-600 hover:text-brand-green transition px-3 py-1.5 border border-gray-300 rounded-full"
          >
            {locale === 'id' ? 'Salin Tautan' : 'Copy Link'}
          </button>
        </div>
      )}
    </>
  );
}