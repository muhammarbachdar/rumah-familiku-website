// app/[locale]/properties/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchProperties, fetchPromos, fetchAvailability, fetchSite } from '@/lib/api';
import { isPromoActive } from '@/lib/utils/whatsapp';
import { getBookedDates } from '@/lib/utils/availability';
import Link from 'next/link';
import { useLocale } from 'next-intl';

import { HotelDetail } from '@/components/property-detail/HotelDetail';
import { VillaDetail } from '@/components/property-detail/VillaDetail';
import { ApartemenDetail } from '@/components/property-detail/ApartemenDetail';
import { KosDetail } from '@/components/property-detail/KosDetail';

export default function PropertyDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const roomTypeFromQuery = searchParams.get('roomType');

  const [property, setProperty] = useState<any>(null);
  const [promos, setPromos] = useState<any[]>([]);
  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchPromos(), fetchSite()])
      .then(([propertiesData, promosData, siteResult]) => {
        const found = propertiesData.find((p: any) => p.slug === slug);
        setProperty(found || null);
        setPromos(promosData || []);
        setSiteData(siteResult || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (property) {
      fetchAvailability(property.id)
        .then((data) => {
          setAvailabilityData(data);
          if (property.type === 'hotel' && data?.roomTypes?.length > 0) {
            const matchedFromQuery = roomTypeFromQuery
              ? data.roomTypes.find((rt: any) => rt.roomTypeId === roomTypeFromQuery)
              : null;
            setSelectedRoomTypeId(matchedFromQuery ? matchedFromQuery.roomTypeId : data.roomTypes[0].roomTypeId);
          }
          if ((property.type === 'kos' || property.type === 'apartemen') && data?.units?.length > 0) {
            setSelectedUnitId(data.units[0].unitId);
          }
          setAvailabilityLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load availability:', err);
          setAvailabilityLoading(false);
        });
    }
  }, [property, roomTypeFromQuery]);

  const getActivePromoForProperty = () => {
    if (!property) return null;
    return promos.find((promo) => {
      if (!promo.active || !isPromoActive(promo.validUntil)) return false;
      if (!promo.propertyIds || promo.propertyIds.length === 0) return true;
      return promo.propertyIds.includes(property.id);
    });
  };

  const activePromo = getActivePromoForProperty();
  const displayPromoTitle = locale === 'id' ? activePromo?.titleId : activePromo?.titleEn;

  const getBookedDatesForDisplay = () => {
    if (!availabilityData) return [];

    if ((property?.type === 'kos' || property?.type === 'apartemen') && selectedUnitId) {
      const unit = availabilityData.units?.find((u: any) => u.unitId === selectedUnitId);
      return getBookedDates(unit?.bookings || []);
    }

    if (availabilityData?.mode === 'property') {
      return getBookedDates(availabilityData.bookings || []);
    }

    return [];
  };

  const bookedDates = getBookedDatesForDisplay();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-text">Loading property...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl text-gray-text mb-4">Property not found</p>
            <Link href={`/${locale}/properties`} className="bg-brand-green text-white px-6 py-2 rounded-lg">
              Back to properties
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {property.type === 'hotel' && (
          <HotelDetail
            property={property}
            availabilityData={availabilityData}
            siteData={siteData}
            activePromo={activePromo}
            displayPromoTitle={displayPromoTitle}
            locale={locale}
          />
        )}
        {property.type === 'kos' && (
          <KosDetail
            property={property}
            availabilityData={availabilityData}
            availabilityLoading={availabilityLoading}
            selectedUnitId={selectedUnitId}
            setSelectedUnitId={setSelectedUnitId}
            bookedDates={bookedDates}
            siteData={siteData}
            activePromo={activePromo}
            displayPromoTitle={displayPromoTitle}
            locale={locale}
          />
        )}
        {property.type === 'rumah' && (
          <VillaDetail
            property={property}
            availabilityData={availabilityData}
            availabilityLoading={availabilityLoading}
            bookedDates={bookedDates}
            siteData={siteData}
            activePromo={activePromo}
            displayPromoTitle={displayPromoTitle}
            locale={locale}
          />
        )}
        {property.type === 'apartemen' && (
          <KosDetail
            property={property}
            availabilityData={availabilityData}
            availabilityLoading={availabilityLoading}
            selectedUnitId={selectedUnitId}
            setSelectedUnitId={setSelectedUnitId}
            bookedDates={bookedDates}
            siteData={siteData}
            activePromo={activePromo}
            displayPromoTitle={displayPromoTitle}
            locale={locale}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}