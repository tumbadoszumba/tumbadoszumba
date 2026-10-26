"use client"

import Script from "next/script"
import { useState, useSyncExternalStore } from "react"

const CONSENT_COOKIE = "tz_analytics_consent"
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

function readConsent() {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1]
}

export function MetaPixel() {
  const consent = useSyncExternalStore(() => () => {}, readConsent, () => undefined)

  if (!pixelId || consent !== "accepted") return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  )
}

export function CookieConsentBanner() {
  const cookieConsent = useSyncExternalStore(() => () => {}, readConsent, () => undefined)
  const [selection, setSelection] = useState<string | undefined>()
  const consent = selection ?? cookieConsent

  if (!pixelId || consent) return null

  function choose(value: "accepted" | "rejected") {
    document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`
    setSelection(value)
  }

  return (
    <aside className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-white shadow-2xl">
      <p>Usamos cookies de medición para entender las visitas y mejorar el sitio. Puedes aceptarlas o rechazarlas.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => choose("accepted")} className="rounded-md bg-brand-orange px-3 py-2 font-semibold text-white">Aceptar medición</button>
        <button type="button" onClick={() => choose("rejected")} className="rounded-md border border-slate-600 px-3 py-2 font-semibold">Rechazar</button>
        <a href="/cookies" className="ml-auto text-slate-300 underline">Política de cookies</a>
      </div>
    </aside>
  )
}
