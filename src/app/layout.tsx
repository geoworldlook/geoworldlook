
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" />
      </head>
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
