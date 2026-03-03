"use server"

import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export type ContactState = {
  success?: boolean;
  error?: string;
}

export async function submitContactForm(prevState: ContactState, formData: FormData): Promise<ContactState> {
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    subject: formData.get('subject') as string,
    message: formData.get('message') as string,
  }

  const result = contactSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  console.log('Contact form submission received:', data)

  return { success: true }
}
