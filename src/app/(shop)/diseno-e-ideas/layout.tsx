import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Ideas de diseño para tumbados y acabados",
  description:
    "Inspírate con ideas de diseño de tumbados de gypsum, cielo raso, luz indirecta y acabados interiores. Tumbados Zumba, La Troncal, Ecuador.",
  path: "/diseno-e-ideas",
})

export default function DisenoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
