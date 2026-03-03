
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GeoWorldLook - Advanced Geospatial Intelligence',
  description: 'High-fidelity spatial data analysis and visualization platform powered by Sentinel satellite data.',
  openGraph: {
    title: 'GeoWorldLook',
    description: 'Interactive geospatial map viewer and technical analysis portfolio.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-[#0a0a0a] text-white antialiased font-body min-h-screen">
        {children}
      </body>
    </html>
  );
}
