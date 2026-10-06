import './globals.css';
import { unstable_cache } from 'next/cache';
import { getAppearanceSettings } from '@/lib/data/content';
import { Toaster } from 'sonner';

function getContrastTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.5 ? '#2d2d2d' : '#ffffff';
}

const getAppearance = unstable_cache(
  async () => {
    const settings = await getAppearanceSettings();
    return settings ?? { primaryColor: '#1B5E20', accentColor: '#C9A84C', backgroundColor: '#FFFFFF' };
  },
  ['appearance'], // Cache key
  { revalidate: 3600 } // Revalidate setiap 1 jam (3600 detik)
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appearance = await getAppearance();

  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        <style>{`
          :root {
            --brand-green: ${appearance.primaryColor};
            --gold: ${appearance.accentColor};
            --gold-text: ${getContrastTextColor(appearance.accentColor)};
            --background: ${appearance.backgroundColor};
          }
        `}</style>
      </head>
      <body className="h-full">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}