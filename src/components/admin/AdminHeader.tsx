"use client"

import Image from "next/image"
import { AdminMobileNav } from "./AdminMobileNav"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
      <AdminMobileNav />
      <Image src="/iconozumba.png" alt="Tumbados Zumba" width={24} height={24} className="h-6 w-6 rounded object-contain" />
      <span className="font-semibold text-sm">Admin Panel</span>
    </header>
  )
}
