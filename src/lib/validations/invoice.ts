import * as z from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
})

export const invoiceSchema = z.object({
  client_id: z.string().uuid().optional(),
  client_name: z.string().optional(),
  client_email: z.string().email().optional(),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['none', 'weekly', 'monthly', 'quarterly', 'yearly']).default('none'),
  template_id: z.string().optional().default('simple'),
}).refine(data => data.client_id || (data.client_name && data.client_email), {
  message: "Either select an existing client or provide a new client name and email",
  path: ["client_id"]
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>
