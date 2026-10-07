import { SITE, ADDRESS_SHORT } from "@/lib/site"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Contacto, dirección y horario en La Troncal, Ecuador",
  description:
    `Visítanos en ${ADDRESS_SHORT}. Horario: ${SITE.hoursText.short}. WhatsApp ${SITE.phoneDisplay}.`,
  path: "/contacto",
})

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
