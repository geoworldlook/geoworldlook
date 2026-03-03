
import React from 'react';
import { Metadata } from 'next';
import { Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import ContactForm from '@/features/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact | GeoWorldLook',
  description: 'Request custom geospatial analysis or discuss satellite data processing for your project.'
};

export default function ContactPage() {
  const infoItems = [
    { icon: Mail, label: "Email", value: "contact@geoworldlook.com" },
    { icon: MapPin, label: "Location", value: "Warsaw, Poland" },
    { icon: Clock, label: "Response Time", value: "Within 24 hours" }
  ];

  const deliverables = [
    "Custom spatial analysis report (PDF)",
    "GeoTIFF outputs for your GIS",
    "Interactive web map if needed",
    "Raw data export (CSV/GeoJSON)"
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          <header>
            <p className="text-emerald-400 text-xs uppercase tracking-widest mb-3">Contact</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Start a Project</h1>
            <p className="text-gray-400 leading-relaxed">
              Have a region of interest? Need satellite-derived metrics for your area? Let's discuss what's possible with automated ML pipelines.
            </p>
          </header>

          <div className="mt-8 space-y-6">
            {infoItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="text-emerald-400" size={16} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-gray-500 text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-[#111] border border-white/[0.06] rounded-xl p-6">
            <p className="text-white font-medium text-sm mb-4">Typical Deliverables</p>
            <div className="space-y-3">
              {deliverables.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-400" size={14} />
                  <span className="text-gray-400 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-[#111] border border-white/[0.06] rounded-xl p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
