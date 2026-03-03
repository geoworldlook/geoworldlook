"use client"

import React, { useActionState } from 'react'
import { submitContactForm, ContactState } from '@/app/contact/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'

const initialState: ContactState = {}

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState)

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-500 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
        <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
        <p className="text-gray-400 max-w-xs mx-auto">Thank you for reaching out. We've received your inquiry and will respond soon.</p>
        <Button 
          variant="outline" 
          className="border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10" 
          onClick={() => window.location.reload()}
        >
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-400">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="John Doe" 
            className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50 text-white" 
            required 
            disabled={isPending} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-400">Email Address</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="john@example.com" 
            className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50 text-white" 
            required 
            disabled={isPending} 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-gray-400">Subject</Label>
        <Input 
          id="subject" 
          name="subject" 
          placeholder="Data analysis inquiry" 
          className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50 text-white" 
          required 
          disabled={isPending} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-gray-400">How can we help?</Label>
        <Textarea 
          id="message" 
          name="message" 
          placeholder="Describe your project or spatial data needs..." 
          rows={5} 
          className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50 text-white" 
          required 
          disabled={isPending} 
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 font-medium animate-in fade-in slide-in-from-top-1">{state.error}</p>
      )}

      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Send Message 
            <Send className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  )
}
