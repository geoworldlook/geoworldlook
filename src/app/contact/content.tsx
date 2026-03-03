
"use client"

import React, { useActionState } from 'react'
import { submitContactForm, ContactState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react'

const initialState: ContactState = {}

export default function ContactContent() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState)

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-bold">Get in Touch</h1>
            <p className="text-muted-foreground leading-relaxed">
              Have a spatial data problem that needs solving? Or want to discuss a potential partnership? Reach out and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start group">
              <div className="p-3 rounded-lg bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-black transition-all">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Email</h4>
                <p className="text-sm text-muted-foreground">hello@geoworldlook.com</p>
              </div>
            </div>

            <div className="flex gap-4 items-start group">
              <div className="p-3 rounded-lg bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-black transition-all">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Phone</h4>
                <p className="text-sm text-muted-foreground">+1 (555) 872-9012</p>
              </div>
            </div>

            <div className="flex gap-4 items-start group">
              <div className="p-3 rounded-lg bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-black transition-all">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Location</h4>
                <p className="text-sm text-muted-foreground">Geospatial Center, Denver, CO</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="lg:col-span-3 bg-[#111111] border-white/[0.06] shadow-xl">
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription className="text-gray-400">Fill out the form below and our team will be in touch shortly.</CardDescription>
          </CardHeader>
          <CardContent>
            {state?.success ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                <h3 className="text-2xl font-bold">Message Sent!</h3>
                <p className="text-muted-foreground text-center">Thank you for reaching out. We've received your inquiry and will respond soon.</p>
                <Button variant="outline" className="border-emerald-400/20 text-emerald-400" onClick={() => window.location.reload()}>Send another message</Button>
              </div>
            ) : (
              <form action={formAction} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50" required disabled={isPending} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50" required disabled={isPending} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="Data analysis inquiry" className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50" required disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">How can we help?</Label>
                  <Textarea id="message" name="message" placeholder="Describe your project or spatial data needs..." rows={5} className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50" required disabled={isPending} />
                </div>

                {state?.error && (
                  <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">{state.error}</p>
                )}

                <Button type="submit" size="lg" className="w-full bg-emerald-400 hover:bg-emerald-500 text-black font-bold gap-2" disabled={isPending}>
                  {isPending ? "Processing..." : <>Send Message <Send className="w-4 h-4" /></>}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
