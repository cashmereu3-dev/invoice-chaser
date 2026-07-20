-- Create invoice_templates table
CREATE TABLE public.invoice_templates (
    id TEXT PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    schema_json JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all system templates and their business templates"
    ON public.invoice_templates FOR SELECT
    USING (
        business_id IS NULL OR 
        public.user_belongs_to_business(business_id)
    );

CREATE POLICY "Users can manage their business templates"
    ON public.invoice_templates FOR ALL
    USING (business_id IS NOT NULL AND public.user_belongs_to_business(business_id));

-- Add template_id to invoices
ALTER TABLE public.invoices ADD COLUMN template_id TEXT REFERENCES public.invoice_templates(id) ON DELETE SET NULL;

-- Seed system templates
INSERT INTO public.invoice_templates (id, business_id, name, category, schema_json) VALUES
('simple', NULL, 'Simple Invoice', 'General', '{"desc": "Clean, minimal design"}'),
('service', NULL, 'Service Invoice', 'Services', '{"desc": "For contractors & trades"}'),
('freelancer', NULL, 'Freelancer/Creator', 'Creative', '{"desc": "For services & deliverables"}');
