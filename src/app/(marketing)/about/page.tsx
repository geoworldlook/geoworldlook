
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About | GeoWorldLook',
  description: 'Geospatial Data Scientist specializing in satellite imagery analysis, remote sensing and ML-driven environmental monitoring.'
};

export default function AboutPage() {
  const experiences = [
    {
      year: "2024 — Present",
      role: "Remote Sensing Data Analyst",
      context: "Geospatial analytics & automated satellite processing"
    },
    {
      year: "2023 — 2024",
      role: "GIS Specialist",
      context: "Spatial data analysis & cartographic production"
    },
    {
      year: "2022 — 2023",
      role: "Junior GIS Analyst",
      context: "Remote sensing & environmental monitoring"
    }
  ];

  const skillGroups = [
    {
      label: "Satellite Data",
      tags: ["Sentinel-1", "Sentinel-2", "Landsat 8/9", "MODIS", "Google Earth Engine"]
    },
    {
      label: "Analysis & ML",
      tags: ["NDVI", "SAR Coherence", "Change Detection", "Random Forest", "U-Net", "LSTM", "Anomaly Detection"]
    },
    {
      label: "Engineering",
      tags: ["Python", "PostGIS", "Supabase", "Docker", "QGIS", "ArcGIS Pro"]
    },
    {
      label: "Frontend",
      tags: ["Next.js", "TypeScript", "MapLibre GL", "TailwindCSS"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <section className="py-16">
        <p className="text-emerald-400 text-xs uppercase tracking-widest mb-3">
          About
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Geospatial Data Scientist
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
          Specialist in satellite imagery analysis, automated remote 
          sensing pipelines and ML-driven environmental monitoring.
          Based in Warsaw, Poland.
        </p>
      </section>

      <div className="border-t border-white/[0.06] my-2" />

      <section className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-12">
            <div>
              <h2 className="text-white font-semibold text-xl mb-4">
                Background
              </h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  I bridge the gap between complex orbital data and actionable terrestrial insights. My work focuses on building the infrastructure that allows satellite observations to become a daily utility for environmental and urban decision-making.
                </p>
                <p>
                  Focused on operational remote sensing applications:
                  forest health monitoring, urban thermal analysis and 
                  multi-temporal change detection using Sentinel-1/2 
                  and Landsat satellite constellations.
                </p>
                <p>
                  All analyses are powered by automated Python pipelines 
                  that ingest, process and store satellite-derived 
                  metrics daily into a PostGIS spatial database.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-white font-semibold text-xl mb-6">
                Experience
              </h2>
              <div className="space-y-0">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="relative pl-6 border-l border-white/[0.08] pb-8 last:pb-0">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-emerald-400 -translate-x-1/2" />
                    <p className="text-emerald-400 text-xs tracking-wider mb-1">{exp.year}</p>
                    <p className="text-white font-medium">{exp.role}</p>
                    <p className="text-gray-500 text-sm">{exp.context}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111] border border-white/[0.06] rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">
                Technical Stack
              </h3>
              <div className="space-y-6">
                {skillGroups.map((group, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.tags.map((tag, tagIdx) => (
                        <span key={tagIdx} className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-400/20 rounded-xl p-6 text-center">
              <p className="text-white font-medium mb-2">Available for projects</p>
              <p className="text-gray-400 text-sm mb-4">Custom geospatial analysis and satellite data processing.</p>
              <Link href="/contact" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-all">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
