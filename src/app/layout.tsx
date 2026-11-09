import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/dataContext';

export const metadata: Metadata = {
  title: 'CivilCorp — Civil Engineering & Multi-Site Financial Management',
  description: 'Manage civil construction projects, client finances, vendor materials, worker wages, and internal project transfers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
