import { SITE } from "@/lib/site"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/JsonLd"
import { contactPageJsonLd, pageMetadata } from "@/lib/seo"
import { getStoreContact } from "@/lib/store-contact.server"
import { addressShort } from "@/lib/store-contact"

export async function generateMetadata(): Promise<Metadata> {
  const contact = await getStoreContact()
  return pageMetadata({
    title: "Contacto, dirección y horario en La Troncal",
    description: `Visítanos en ${addressShort(contact)}. Horario: ${SITE.hoursText.short}. WhatsApp ${contact.phoneDisplay}.`,
    path: "/contacto",
  })
}

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={contactPageJsonLd()} />
      {children}
    </>
  )
}
