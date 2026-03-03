"use server"

import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  projectType: z.enum([
    'forest-monitoring',
    'urban-analysis', 
    'agriculture',
    'sar-change-detection',
    'custom'
  ], {
    errorMap: () => ({ message: 'Please select a valid project type' })
  }),
  message: z.string().min(20, 'Message must be at least 20 characters')
})

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
  errors?: Record<string, string[]>
}

export async function submitContact(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    company: formData.get('company'),
    projectType: formData.get('projectType'),
    message: formData.get('message')
  }

  const result = ContactSchema.safeParse(raw)

  if (!result.success) {
    return {
      status: 'error',
      message: 'Please fix the errors below.',
      errors: result.error.flatten().fieldErrors
    }
  }

  // Simulate process delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Log submission (replace with email service like Resend in production)
  console.log('[GeoWorldLook Contact Form Submission]', result.data)

  return {
    status: 'success',
    message: "Message received! I'll respond to your inquiry within 24 hours."
  }
}
