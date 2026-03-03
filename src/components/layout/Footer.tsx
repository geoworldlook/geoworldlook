
import React from 'react'
import { Globe, Github, Twitter, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              <span className="font-headline font-bold text-lg tracking-tight">GeoWorldLook</span>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Advancing geospatial intelligence through interactive mapping and data-driven analysis. Visualizing the world, one coordinate at a time.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/analyses" className="hover:text-primary transition-colors">Portfolio</a></li>
              <li><a href="/blog" className="hover:text-primary transition-colors">Technical Blog</a></li>
              <li><a href="/about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-all">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-all">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} GeoWorldLook. All rights reserved. Crafted for geospatial enthusiasts.</p>
        </div>
      </div>
    </footer>
  )
}
