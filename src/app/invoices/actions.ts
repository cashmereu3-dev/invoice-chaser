'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { invoiceSchema, InvoiceFormValues } from '@/lib/validations/invoice'

export async function createInvoiceAction(data: InvoiceFormValues) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    throw new Error('Not authenticated')
  }

  // Validate the data
  const validatedFields = invoiceSchema.safeParse(data)
  if (!validatedFields.success) {
    return { error: 'Invalid fields', details: validatedFields.error.flatten() }
  }

  // Get business_id
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('business_id')
    .eq('user_id', userData.user.id)
    .single()

  if (!userRole) {
    return { error: 'No business found for user' }
  }

  // Enforce usage limits
  const { checkUsageLimit } = await import('@/lib/usage')
  const usage = await checkUsageLimit(userRole.business_id, 'invoices')
  if (!usage.allowed) {
    return { error: `Plan limit reached. You can only create ${usage.limit} invoices per month on your current plan.` }
  }

  const { items, tax, discount, client_name, client_email, ...invoiceData } = validatedFields.data

  let finalClientId = invoiceData.client_id;

  // If no client_id is provided, create a new client
  if (!finalClientId) {
    if (!client_name) {
      return { error: 'Client name is required when creating a new client' };
    }
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        business_id: userRole.business_id,
        name: client_name,
        email: client_email || null,
      })
      .select()
      .single()

    if (clientError) {
      console.error('Client creation error:', clientError)
      return { error: 'Failed to create new client: ' + clientError.message }
    }
    finalClientId = newClient.id;
  }

  // Calculate subtotal
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
  const total = subtotal + tax - discount

  // Insert Invoice
  const { data: newInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      ...invoiceData,
      client_id: finalClientId,
      business_id: userRole.business_id,
      subtotal,
      tax,
      discount,
      total,
      ...(invoiceData.is_recurring ? { last_recurring_date: invoiceData.issue_date } : {})
    })
    .select()
    .single()

  if (invoiceError) {
    console.error('Invoice creation error:', invoiceError)
    return { error: invoiceError.message }
  }

  // Insert Items
  const itemsToInsert = items.map(item => ({
    ...item,
    invoice_id: newInvoice.id,
    total: item.quantity * item.unit_price
  }))

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // If item insertion fails, we should ideally rollback (not natively supported in Supabase REST yet)
    // For now we just return error
    console.error('Invoice items creation error:', itemsError)
    return { error: itemsError.message }
  }

  revalidatePath('/invoices')
  return { success: true, invoiceId: newInvoice.id }
}
