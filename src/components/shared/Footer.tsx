
import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <span className="text-emerald-400 mr-2 text-lg">●</span>
              <span className="font-semibold text-white tracking-tight">GeoWorldLook</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Satellite intelligence for real decisions.
              Remote sensing & geospatial analytics tailored for high-stakes industries.
            </p>
          </div>

          {/* Column 2 - Navigation */}
          <div>
            <p className="text-white text-sm font-medium mb-4">Navigation</p>
            <ul className="space-y-3">
              {[
                { href: '/analyses', label: 'Analyses' },
                { href: '/blog', label: 'Blog' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Connect */}
          <div>
            <p className="text-white text-sm font-medium mb-4">Connect</p>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-2 transition-colors"
                >
                  <Github size={16} /> GitHub
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-2 transition-colors"
                >
                  <Linkedin size={16} /> LinkedIn
                </a>
              </li>
              <li className="text-gray-500 text-sm flex items-center gap-2 pt-1">
                <MapPin size={16} className="text-emerald-400/60" /> Warsaw, Poland
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] mt-12 pt-8 text-center">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} GeoWorldLook. Built with Sentinel satellite data.
          </p>
        </div>
      </div>
    </footer>
  );
}
