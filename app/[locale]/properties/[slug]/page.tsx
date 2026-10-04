// app/[locale]/properties/[slug]/page.tsx
import { getLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PropertyDetailWrapper } from '@/components/property-detail/PropertyDetailWrapper';
import { getPropertiesPaginated } from '@/lib/data/properties';
import { getPromos, getSiteSettings } from '@/lib/data/content';
import { getAvailabilityForProperty } from '@/lib/data/availability';
import { isPromoActive } from '@/lib/utils/whatsapp';
import { getBookedDates } from '@/lib/utils/availability';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ roomType?: string }>;
}) {
  const { slug, locale } = await params;
  const { roomType: roomTypeFromQuery } = await searchParams;

  const [propertiesData, promosData, siteResult] = await Promise.all([
    getPropertiesPaginated(),
    getPromos(),
    getSiteSettings(),
  ]);

  const properties = propertiesData?.data || propertiesData || [];
  const promos = promosData || [];
  const siteData = siteResult || null;

  const property = properties.find((p: any) => p.slug === slug);

  if (!property) {
    notFound();
  }

  let availabilityData = null;
  let availabilityLoading = false;
  let initialUnitId: string | null = null;

  try {
    availabilityData = await getAvailabilityForProperty(property.id);

    if (
      property.type === 'kos' &&
      availabilityData &&
      'units' in availabilityData &&
      availabilityData.units.length > 0
    ) {
      initialUnitId = availabilityData.units[0].unitId;
    }
  } catch (err) {
    console.error('Failed to load availability:', err);
    availabilityLoading = true;
  }

  const activePromo = promos.find((promo: any) => {
    if (!promo.active || !isPromoActive(promo.validUntil)) return false;
    if (!promo.propertyIds || promo.propertyIds.length === 0) return true;
    return promo.propertyIds.includes(property.id);
  });

  const displayPromoTitle = locale === 'id' ? activePromo?.titleId : activePromo?.titleEn;

  let bookedDates: string[] = [];
  if (availabilityData) {
    if ((property.type === 'kos' || property.type === 'apartemen') && initialUnitId) {
      const unit = availabilityData.units?.find((u: any) => u.unitId === initialUnitId);
      bookedDates = getBookedDates(unit?.bookings || []);
    } else if (availabilityData?.mode === 'property') {
      bookedDates = getBookedDates(availabilityData.bookings || []);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <PropertyDetailWrapper
          property={property}
          availabilityData={availabilityData}
          availabilityLoading={availabilityLoading}
          bookedDates={bookedDates}
          siteData={siteData}
          activePromo={activePromo}
          displayPromoTitle={displayPromoTitle}
          locale={locale}
          // ✅ GANTI: initialUnitId bukan selectedUnitId
          initialUnitId={initialUnitId}
        />
      </main>
      <Footer />
    </div>
  );
}