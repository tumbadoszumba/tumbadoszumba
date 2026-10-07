import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Ofertas en gypsum, cielo raso y herramientas",
  description:
    "Productos con descuento en placas de yeso, cielo raso, perfilería y herramientas para tumbados. Tumbados Zumba, La Troncal, Ecuador.",
  path: "/ofertas",
})

export default function OfertasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
