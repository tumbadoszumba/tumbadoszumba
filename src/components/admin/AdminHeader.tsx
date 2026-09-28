"use client"

import { AdminMobileNav } from "./AdminMobileNav"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
      {/* Mobile Menu */}
      <AdminMobileNav />
    </header>
  )
}
