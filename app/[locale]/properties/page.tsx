import { getLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPropertiesPaginated } from '@/lib/data/properties';
import { PropertyFilter } from './PropertyFilter';

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const propertiesData = await getPropertiesPaginated();
  const properties = propertiesData?.data || propertiesData || [];
  const validTypes = ['hotel', 'kos', 'apartemen', 'rumah'];
  const initialType = params.type && validTypes.includes(params.type) ? params.type : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="bg-brand-green text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
              {locale === 'id' ? 'Semua Properti' : 'All Properties'}
            </h1>
            <p className="text-white/80">
              {properties.length} {locale === 'id' ? 'properti tersedia' : 'properties available'}
            </p>
          </div>
        </section>
        <PropertyFilter properties={properties} locale={locale} initialType={initialType} />
      </main>
      <Footer />
    </div>
  );
}