import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"

// Checkout, éxito y cancelación: flujo de compra privado
export const metadata: Metadata = { title: "Finalizar compra", ...noIndexMetadata }

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
