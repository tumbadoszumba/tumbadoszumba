import { SITE, ADDRESS_SHORT } from "@/lib/site"
import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"
import { socialLinks } from "@/lib/social"
import { Separator } from "@/components/ui/separator"

interface FooterProduct {
  id: string
  name: string
  slug: string
}

const footerLinks = {
  empresa: [
    { name: "Sobre Nosotros", href: "/contacto" },
    { name: "Contacto", href: "/contacto" },
    { name: "Trabaja con Nosotros", href: "/contacto" },
  ],
  ayuda: [
    { name: "Centro de Ayuda", href: "/contacto" },
    { name: "Envíos y Entregas", href: "/contacto" },
    { name: "Devoluciones", href: "/contacto" },
    { name: "Garantía", href: "/contacto" },
    { name: "Preguntas Frecuentes", href: "/contacto" },
  ],
  legal: [
    { name: "Términos y Condiciones", href: "/terms" },
    { name: "Política de Privacidad", href: "/privacy" },
    { name: "Cookies", href: "/cookies" },
  ],
}

export function Footer({ products = [] }: { products?: FooterProduct[] }) {
  const bestSellers = products.slice(0, 6)

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-light.png"
                alt="Tumbados Zumba"
                width={120}
                height={32}
                className="h-8 w-auto object-contain dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt="Tumbados Zumba"
                width={120}
                height={32}
                className="h-8 w-auto object-contain hidden dark:block"
              />
              <span className="font-bold text-lg">Tumbados Zumba</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Tu tienda de tumbados de gypsum de confianza. Los mejores productos y acabados para tu hogar a los mejores precios.
            </p>
            <div className="mt-4 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className={`text-muted-foreground transition-colors ${social.hoverClassName}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Más vendidos */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Los más vendidos</h3>
            <ul className="mt-4 space-y-2">
              {bestSellers.length === 0 ? (
                <>
                  <li className="text-sm text-muted-foreground">Gypsum Estándar</li>
                  <li className="text-sm text-muted-foreground">Panel WPC Acanalado</li>
                  <li className="text-sm text-muted-foreground">Lámina Mármol PVC</li>
                  <li className="text-sm text-muted-foreground">Perfil Omega</li>
                  <li className="text-sm text-muted-foreground">Cielo Raso PVC</li>
                  <li className="text-sm text-muted-foreground">Masilla Drywall</li>
                </>
              ) : (
                bestSellers.map((prod) => (
                  <li key={prod.id}>
                    <Link
                      href={`/products/${prod.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground line-clamp-1"
                    >
                      {prod.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Empresa</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Ayuda</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.ayuda.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Contacto</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} />
                <span>{ADDRESS_SHORT}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{SITE.phoneDisplay}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{SITE.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Tumbados Zumba. Todos los derechos reservados.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Desarrollado por <a href="https://www.cauralis.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Cauralis</a>
            </p>
          </div>
          <div className="flex gap-4">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

