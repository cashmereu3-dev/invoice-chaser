import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/server'
import { getNextInvoiceNumber } from '@/app/invoices/auto-number'
import InvoiceBuilder from '@/components/invoices/invoice-builder'

export default async function InvoiceBuilderPage() {
  const supabase = await createClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null;

  // Get business info
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('business_id, businesses(*)')
    .eq('user_id', user.id)
    .single()

  const businessProfile = userRole?.businesses;

  // Get clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, email')
    .order('name')

  // Generate next invoice number
  const nextInvoiceNumber = userRole?.business_id 
    ? await getNextInvoiceNumber(userRole.business_id) 
    : 'INV-001'

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Builder</h1>
          <p className="text-muted-foreground">Dynamically build, preview, and generate PDF invoices.</p>
        </div>
        
        <InvoiceBuilder 
          clients={clients || []} 
          defaultInvoiceNumber={nextInvoiceNumber}
          businessProfile={businessProfile}
        />
      </div>
    </AppLayout>
  )
}
