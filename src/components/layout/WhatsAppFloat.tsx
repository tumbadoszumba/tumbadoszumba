"use client"

import { SITE } from "@/lib/site"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { socialLinks as links } from "@/lib/social"
import { QuotePopup } from "@/components/quote/QuotePopup"

export function WhatsAppFloat() {
  const [mounted, setMounted] = useState(false)
  const [isQuoteOpen, setIsQuoteOpen] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Mostrar el popup cada vez que entra a la página, a menos que esté logueado
  useEffect(() => {
    // Si la sesión aún está cargando o el usuario ya está autenticado, no abrir automáticamente
    if (status === "loading" || status === "authenticated") {
      return
    }

    // Usuario no logueado: abrir automáticamente tras 2 segundos
    const timer = setTimeout(() => {
      setIsQuoteOpen(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [status, session])

  return (
    <>
      {/* En celular se ocultan: WhatsApp va en el header y las redes en el Menú */}
      <div className="fixed bottom-5 right-5 z-50 hidden md:flex items-center gap-3 print:hidden">
        {links.map((link, i) => {
          const isWhatsApp = link.label.toLowerCase().includes("whatsapp")

          if (isWhatsApp) {
            return (
              <button
                key={link.label}
                type="button"
                onClick={() => setIsQuoteOpen(true)}
                aria-label={link.label}
                title={link.label}
                style={{ transitionDelay: `${i * 80}ms` }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110 sm:h-14 sm:w-14 cursor-pointer",
                  link.className,
                  mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 fill-current sm:h-7 sm:w-7"
                  aria-hidden
                >
                  {link.icon}
                </svg>
              </button>
            )
          }

          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
              style={{ transitionDelay: `${i * 80}ms` }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110 sm:h-14 sm:w-14",
                link.className,
                mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 fill-current sm:h-7 sm:w-7"
                aria-hidden
              >
                {link.icon}
              </svg>
            </a>
          )
        })}
      </div>

      <QuotePopup
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        whatsappNumber={SITE.whatsapp}
      />
    </>
  )
}

