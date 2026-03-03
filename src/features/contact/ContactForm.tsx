"use client"

import React, { useActionState } from 'react'
import { submitContact, ContactFormState } from '@/app/(marketing)/contact/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'

const initialState: ContactFormState = {
  status: 'idle',
  message: ''
}

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContact, initialState)

  if (state?.status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-500 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
        <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
        <p className="text-gray-400 max-w-xs mx-auto">{state.message}</p>
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
          {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
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
          {state?.errors?.email && <p className="text-xs text-red-400 mt-1">{state.errors.email[0]}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company" className="text-gray-400">Company (Optional)</Label>
          <Input 
            id="company" 
            name="company" 
            placeholder="Organization" 
            className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50 text-white" 
            disabled={isPending} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectType" className="text-gray-400">Project Type</Label>
          <select 
            id="projectType" 
            name="projectType" 
            className="w-full h-10 rounded-md bg-black/40 border border-white/[0.1] focus:border-emerald-400/50 text-white px-3 text-sm focus:outline-none"
            required 
            disabled={isPending}
          >
            <option value="">Select type...</option>
            <option value="forest-monitoring">Forest Monitoring</option>
            <option value="urban-analysis">Urban Thermal Analysis</option>
            <option value="agriculture">Agricultural Monitoring</option>
            <option value="sar-change-detection">SAR Change Detection</option>
            <option value="custom">Custom Analysis</option>
          </select>
          {state?.errors?.projectType && <p className="text-xs text-red-400 mt-1">{state.errors.projectType[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-gray-400">How can we help?</Label>
        <Textarea 
          id="message" 
          name="message" 
          placeholder="Describe your project, region of interest, and timeline..." 
          rows={5} 
          className="bg-black/40 border-white/[0.1] focus:border-emerald-400/50 text-white" 
          required 
          disabled={isPending} 
        />
        {state?.errors?.message && <p className="text-xs text-red-400 mt-1">{state.errors.message[0]}</p>}
      </div>

      {state?.status === 'error' && !state.errors && (
        <p className="text-sm text-red-400 font-medium animate-in fade-in slide-in-from-top-1">{state.message}</p>
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
            Sending...
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
