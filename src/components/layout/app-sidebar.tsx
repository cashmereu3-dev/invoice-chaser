import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  PieChart,
  Bot,
  PenTool
} from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="hidden border-r bg-muted/40 md:block w-64 h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Bot className="h-6 w-6" />
            <span className="">InvoiceOS AI</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/clients"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Users className="h-4 w-4" />
              Clients
            </Link>
            <Link
              href="/invoices"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <FileText className="h-4 w-4" />
              Invoices
            </Link>
            <Link
              href="/dashboard/invoice-builder"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <PenTool className="h-4 w-4" />
              Invoice Builder
            </Link>
            <Link
              href="/settings/payments"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <CreditCard className="h-4 w-4" />
              Payments
            </Link>
            <Link
              href="/reports"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <PieChart className="h-4 w-4" />
              Reports
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
