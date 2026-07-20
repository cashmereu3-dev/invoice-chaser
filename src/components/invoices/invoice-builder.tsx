'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createInvoiceAction } from '@/app/invoices/actions';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/pdf/invoice-template';
import { Plus, Trash2, Download, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InvoiceBuilder({ 
  clients, 
  defaultInvoiceNumber,
  businessProfile
}: { 
  clients: any[], 
  defaultInvoiceNumber: string,
  businessProfile: any
}) {
  const router = useRouter();
  
  const [template, setTemplate] = useState('simple');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Business Info
  const [businessName, setBusinessName] = useState(businessProfile?.name || 'Your Business Name');
  const [businessEmail, setBusinessEmail] = useState(businessProfile?.email || 'business@example.com'); // We may not have email in business table, but placeholder is fine

  // Client Info
  const [selectedClientId, setSelectedClientId] = useState<string | 'new'>('new');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(0);

  // Line Items
  const [lineItems, setLineItems] = useState([
    { id: 1, description: 'Professional Services', quantity: 1, rate: 150 },
  ]);
  const [notes, setNotes] = useState('Payment due within 30 days. Thank you for your business!');

  const templates = {
    simple: { name: 'Simple Invoice', desc: 'Clean, minimal design' },
    service: { name: 'Service Invoice', desc: 'For contractors & trades' },
    freelancer: { name: 'Freelancer/Creator', desc: 'For services & deliverables' }
  };

  useEffect(() => {
    if (selectedClientId && selectedClientId !== 'new') {
      const c = clients.find(c => c.id === selectedClientId);
      if (c) {
        setClientName(c.name);
        setClientEmail(c.email || '');
      }
    } else {
      setClientName('');
      setClientEmail('');
    }
  }, [selectedClientId, clients]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
  };

  const updateLineItem = (id: number, field: string, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: field === 'description' ? value : parseFloat(value as string) || 0 } : item
    ));
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) setLineItems(lineItems.filter(item => item.id !== id));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const saveInvoice = async () => {
    setIsSaving(true);
    setError('');
    
    try {
      const payload = {
        client_id: selectedClientId === 'new' ? undefined : selectedClientId,
        client_name: selectedClientId === 'new' ? clientName : undefined,
        client_email: selectedClientId === 'new' ? clientEmail : undefined,
        invoice_number: invoiceNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        notes: notes,
        tax: tax,
        discount: 0,
        is_recurring: false,
        recurring_interval: 'none' as any,
        template_id: template,
        items: lineItems.map(item => ({
          description: item.description || 'Item',
          quantity: item.quantity || 1,
          unit_price: item.rate || 0,
        }))
      };

      const result = await createInvoiceAction(payload);
      
      if (result && 'error' in result && (result as any).error) {
        setError(typeof (result as any).error === 'string' ? (result as any).error : JSON.stringify((result as any).error));
      } else {
        router.push('/invoices');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Mock invoice for PDF generation
  const mockInvoice = {
    invoice_number: invoiceNumber,
    issue_date: invoiceDate,
    due_date: dueDate,
    subtotal,
    tax,
    discount: 0,
    total,
    notes,
    business: businessProfile || { name: businessName },
    client: { name: clientName || 'Client Name', email: clientEmail },
    items: lineItems.map(i => ({ ...i, unit_price: i.rate }))
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* ===== LEFT PANEL: EDITOR ===== */}
      <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-y-auto p-6 space-y-8">

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4">Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(templates).map(([key, tmpl]) => (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                className={`p-4 rounded-lg border text-left transition-all ${template === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
              >
                <div className="font-medium text-sm">{tmpl.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{tmpl.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bill To</h3>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val || 'new')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or create client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Create New Client</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientId === 'new' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input type="number" min="0" step="0.1" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Line Items</h3>
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 p-4 bg-muted/30 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Input value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} placeholder="Service description" />
                </div>
                <div className="w-20 space-y-2">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)} />
                </div>
                <div className="w-28 space-y-2">
                  <Label className="text-xs">Rate</Label>
                  <Input type="number" value={item.rate} onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)} />
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-xs">Total</Label>
                  <div className="h-8 px-3 py-1 bg-background border rounded-lg flex items-center justify-end font-medium text-sm">
                    ${(item.quantity * item.rate).toFixed(2)}
                  </div>
                </div>
                <div className="pt-6">
                  <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-2" /> Add Line Item
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Thank you for your business..."
          />
        </section>

        <div className="pt-4 border-t flex gap-4">
          <Button onClick={saveInvoice} disabled={isSaving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Invoice'}
          </Button>
        </div>
      </div>

      {/* ===== RIGHT PANEL: LIVE PREVIEW ===== */}
      <div className="flex-1 bg-card border rounded-xl shadow-sm p-8 overflow-y-auto hidden md:block">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="font-semibold text-lg">Live Preview</h3>
          <PDFDownloadLink
            document={<InvoicePDF invoice={mockInvoice as any} paymentUrl="" />}
            fileName={`${invoiceNumber}.pdf`}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2"
          >
            {/* @ts-ignore - PDFDownloadLink child function types are tricky */}
            {({ loading }) => (
              <>
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
        </div>
        
        {/* Render HTML preview resembling PDF */}
        <div className="max-w-[700px] mx-auto bg-white border border-gray-200 shadow-sm p-10 font-sans text-sm text-gray-900 rounded-sm">
          <div className="flex justify-between items-start mb-12 border-b-2 border-gray-900 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{businessName}</h2>
              <p className="text-gray-500">{businessEmail}</p>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold tracking-tight text-emerald-600">INVOICE</h1>
            </div>
          </div>

          <div className="flex justify-between mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bill To</p>
              <p className="font-bold text-base">{clientName || 'Client Name'}</p>
              <p className="text-gray-500">{clientEmail || 'client@email.com'}</p>
            </div>
            <div className="text-right space-y-1">
              <p><span className="text-gray-400 font-medium inline-block w-24">Invoice No:</span> <span className="font-medium">{invoiceNumber}</span></p>
              <p><span className="text-gray-400 font-medium inline-block w-24">Date:</span> <span>{invoiceDate}</span></p>
              <p><span className="text-gray-400 font-medium inline-block w-24">Due:</span> <span>{dueDate}</span></p>
            </div>
          </div>

          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-3 text-left font-semibold text-gray-600">Description</th>
                <th className="py-3 text-right font-semibold text-gray-600 w-24">Qty</th>
                <th className="py-3 text-right font-semibold text-gray-600 w-32">Rate</th>
                <th className="py-3 text-right font-semibold text-gray-600 w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 text-gray-800">{item.description || '-'}</td>
                  <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-600">${item.rate.toFixed(2)}</td>
                  <td className="py-4 text-right font-medium text-gray-900">${(item.quantity * item.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-12">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pb-3 border-b border-gray-200">
                <span>Tax ({taxRate}%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                <span>Total</span>
                <span className="text-emerald-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {notes && (
            <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500">
              <p className="font-bold uppercase tracking-wider text-gray-400 text-xs mb-2">Notes</p>
              <p className="whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
