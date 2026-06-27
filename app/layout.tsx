import './globals.css';
import { promises as fs } from 'fs';
import path from 'path';
import { unstable_cache } from 'next/cache';

const getAppearance = unstable_cache(
  async () => {
    try {
      const filePath = path.join(process.cwd(), 'data', 'appearance.json');
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { primaryColor: '#1B5E20', accentColor: '#C9A84C', backgroundColor: '#FFFFFF' };
    }
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
            --background: ${appearance.backgroundColor};
          }
        `}</style>
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}