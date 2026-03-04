# GeoWorldLook - Geospatial Intelligence Platform

Advanced geospatial data visualization platform built with Next.js, MapLibre GL, and Supabase.

## Project Structure

This project uses the Next.js App Router with a route group strategy:
- `src/app/(marketing)/`: All public-facing routes (Home, About, Analyses, Blog, Contact).
- `src/features/`: Modular components like the Map Viewer and Contact Form.
- `src/lib/`: Shared utilities and database queries.

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up your Supabase environment variables.
4. Run the development server: `npm run dev`.

## Deployment to GitHub

To push this project to your own GitHub repository, run the following commands in your terminal:

```bash
git init
git add .
git commit -m "feat: initial commit with consolidated marketing routes"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
