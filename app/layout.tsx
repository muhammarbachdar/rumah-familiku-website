import './globals.css';
import { promises as fs } from 'fs';
import path from 'path';

async function getAppearance() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'appearance.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { primaryColor: '#1B5E20', accentColor: '#C9A84C', backgroundColor: '#FFFFFF' };
  }
}

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