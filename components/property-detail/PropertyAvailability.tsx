// components/property-detail/PropertyAvailability.tsx
'use client';

import { useState } from 'react';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';

interface PropertyAvailabilityProps {
  bookedDates: string[];
  availabilityLoading: boolean;
  locale: string;
}

export function PropertyAvailability({
  bookedDates,
  availabilityLoading,
  locale,
}: PropertyAvailabilityProps) {
  const [showAvailability, setShowAvailability] = useState(false);

  return (
    <div className="mt-8">
      {!showAvailability ? (
        <button
          onClick={() => setShowAvailability(true)}
          className="block w-full bg-brand-green text-white py-4 rounded-xl font-bold text-center text-lg hover:bg-green-hover transition shadow-md"
        >
          {locale === 'id' ? 'Cek Ketersediaan' : 'Check Availability'}
        </button>
      ) : (
        <div>
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
            {locale === 'id' ? 'Ketersediaan' : 'Availability'}
          </h2>
          {availabilityLoading ? (
            <p className="text-gray-text">{locale === 'id' ? 'Memuat data ketersediaan...' : 'Loading availability...'}</p>
          ) : (
            <div className="bg-cream rounded-2xl p-6">
              <AvailabilityCalendar
                bookedDates={bookedDates}
                mode="view"
                locale={locale === 'id' ? 'id' : 'en'}
              />
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-white border border-gray-300 inline-block" />
                  {locale === 'id' ? 'Tersedia' : 'Available'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 inline-block" />
                  {locale === 'id' ? 'Sudah dibooking' : 'Booked'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {locale === 'id'
                  ? 'Kalender hanya untuk perkiraan, silakan hubungi kami via WhatsApp untuk konfirmasi final.'
                  : 'Calendar is for estimation only, please contact us via WhatsApp for final confirmation.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}