"use client"

import React, { useActionState } from 'react'
import { submitContact, ContactFormState } from '@/app/(marketing)/contact/actions'
import { CheckCircle, Loader2, Send } from 'lucide-react'

const initialState: ContactFormState = {
  status: 'idle',
  message: ''
}

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContact, initialState)

  if (state.status === 'success') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-12 h-12 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-emerald-400" size={24} />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">
          Message Sent!
        </h3>
        <p className="text-gray-400 text-sm">{state.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 text-emerald-400 text-xs font-medium hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            required
            className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-gray-600 transition-colors duration-200"
          />
          {state.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label htmlFor="email" className="text-sm text-gray-400 mb-1.5 block">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-gray-600 transition-colors duration-200"
          />
          {state.errors?.email && <p className="text-xs text-red-400 mt-1">{state.errors.email[0]}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="company" className="text-sm text-gray-400 mb-1.5 block">Company (Optional)</label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="Company or organization"
          className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-gray-600 transition-colors duration-200"
        />
      </div>

      <div>
        <label htmlFor="projectType" className="text-sm text-gray-400 mb-1.5 block">Project Type</label>
        <select
          id="projectType"
          name="projectType"
          defaultValue=""
          required
          className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-gray-600 transition-colors duration-200"
        >
          <option value="" disabled>Select project type...</option>
          <option value="forest-monitoring">Forest Monitoring</option>
          <option value="urban-analysis">Urban Thermal Analysis</option>
          <option value="agriculture">Agricultural Monitoring</option>
          <option value="sar-change-detection">SAR Change Detection</option>
          <option value="custom">Custom Analysis</option>
        </select>
        {state.errors?.projectType && <p className="text-xs text-red-400 mt-1">{state.errors.projectType[0]}</p>}
      </div>

      <div>
        <label htmlFor="message" className="text-sm text-gray-400 mb-1.5 block">How can I help?</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Describe your project, region of interest, and timeline..."
          required
          className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-gray-600 transition-colors duration-200"
        />
        {state.errors?.message && <p className="text-xs text-red-400 mt-1">{state.errors.message[0]}</p>}
      </div>

      {state.status === 'error' && state.message && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg">{state.message}</p>
      )}

      <button type="submit" disabled={isPending}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send size={16} />
          </>
        )}
      </button>
    </form>
  )
}
