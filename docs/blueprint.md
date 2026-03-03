# **App Name**: GeoWorldLook

## Core Features:

- Geospatial Map Display: Interactive map viewer on the homepage leveraging MapLibre GL JS to showcase geospatial data layers relevant to analytics. Map configurations (center, zoom, style) are hardcoded in `src/features/map/config.ts`, while geospatial data points are fetched from Supabase's 'spatial_data' table.
- Geospatial Analyses Portfolio: Dedicated '/analyses' page displaying a portfolio of geospatial case studies and projects, with content dynamically fetched from Supabase's 'analyses' table.
- Technical Blog: The '/blog' section will display technical articles authored as local MDX files stored in `/content/blog/`, parsed using gray-matter and rendered with next-mdx-remote.
- Informational & Contact Pages: Essential static pages for '/about' the author/company and a '/contact' page with a submission form handled by a Next.js Server Action (without database write).
- Shared Navigation and Footer: Implementation of responsive, dark-themed Navbar and Footer components across the site for consistent branding and navigation.
- Supabase Read-Only Data Integration: Secure read-only fetching of geospatial data points for the map and analyses portfolio from Supabase, using the @supabase/ssr library.

## Style Guidelines:

- Default Dark Theme: Background (#0a0a0a) and Surface (#111111) as specified, creating a professional, low-light environment.
- Primary Color: Emerald Green (#10b981), acting as the main accent for interactive elements and highlights, symbolizing vegetation and satellite data as requested.
- Secondary Accent Color: A light, cool mint green (#8ee6c4) derived from the primary's hue, providing complementary contrast and a modern feel for supplementary emphasis.
- Body and Headline Font: 'Inter' (sans-serif), ensuring readability and a modern, data-driven aesthetic as specified. Note: currently only Google Fonts are supported.
- Minimalist, line-art or geometric icons that complement the data-driven and professional aesthetic, avoiding overly decorative elements.
- Mobile-First Responsive Design: Layouts are built to fluidly adapt to all screen sizes, prioritizing user experience on smaller devices.
- Consistent Structure: Shared dark-themed Navbar and Footer for consistent brand presence and effortless site navigation.
- Subtle UI Animations: Use delicate hover effects, smooth transitions for map interactions, and page changes to enhance user experience without distraction.