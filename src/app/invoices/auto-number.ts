import { createClient } from '@/lib/supabase/server'

export async function getNextInvoiceNumber(businessId: string): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data || !data.invoice_number) {
    return 'INV-001'
  }

  const lastNumber = data.invoice_number
  const match = lastNumber.match(/INV-(\d+)/)

  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1
    return `INV-${nextNum.toString().padStart(3, '0')}`
  }

  // Fallback if parsing fails
  return `INV-${Date.now().toString().slice(-4)}`
}
