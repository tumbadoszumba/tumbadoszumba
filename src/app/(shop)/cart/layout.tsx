import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"

// Carrito: página personal, sin valor para buscadores
export const metadata: Metadata = { title: "Carrito", ...noIndexMetadata }

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
