import { ImageResponse } from "next/og"
import { SITE } from "@/lib/site"

export const alt = `${SITE.name}: gypsum, cielo raso PVC y acabados en ${SITE.address.city}, ${SITE.address.country}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Imagen por defecto al compartir el sitio (WhatsApp, Facebook, etc.). Las
 * fichas de producto usan su propia foto, esta cubre el resto de páginas.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "linear-gradient(135deg, #0b2a6f 0%, #1d4ed8 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#fb923c", fontWeight: 700, letterSpacing: 4 }}>
          ACABADO EN INTERIORES
        </div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 800, marginTop: 14, lineHeight: 1.05 }}>
          {SITE.name}
        </div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 28, color: "#dbeafe" }}>
          Gypsum, cielo raso PVC y acabados
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 54,
            fontSize: 34,
            fontWeight: 700,
            background: "#f97316",
            color: "white",
            padding: "14px 30px",
            borderRadius: 14,
            alignSelf: "flex-start",
          }}
        >
          {SITE.address.city}, {SITE.address.country}
        </div>
      </div>
    ),
    size
  )
}
