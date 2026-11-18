import Link from "next/link"
import { LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileSidebar } from "@/components/profile/ProfileSidebar"
import { ProfileMobileNav } from "@/components/profile/ProfileMobileNav"
import { auth } from "@/lib/auth"
import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"

export const metadata: Metadata = noIndexMetadata

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Mi Cuenta</h1>

      {isAdmin && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
          <div>
            <p className="font-semibold text-sm">Estás usando una cuenta de administrador</p>
            <p className="text-xs text-muted-foreground mt-0.5">Gestiona productos, pedidos y configuración desde el panel.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Panel Admin
            </Link>
          </Button>
        </div>
      )}

      {!isAdmin && <ProfileMobileNav />}

      <div className="flex gap-8">
        {!isAdmin && (
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <ProfileSidebar />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
