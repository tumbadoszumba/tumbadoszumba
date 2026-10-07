import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"

// Panel privado: nunca debe aparecer en buscadores
export const metadata: Metadata = noIndexMetadata

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
