import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

/**
 * Zonas privadas o sin valor para buscadores.
 * OJO: NO bloquear "/api/". Las páginas públicas (/products, /ofertas,
 * /diseno-e-ideas) cargan su contenido desde /api/products, /api/categories,
 * /api/brands y /api/tiktok-oembed; si el robots las bloquea, Google las ve vacías.
 */
const disallow = ["/admin", "/cart", "/checkout", "/profile", "/login", "/register"]

/**
 * Buscadores de IA (ChatGPT, Claude, Perplexity, Gemini, Apple) y su rastreo.
 * Se permiten de forma explícita para que la tienda pueda aparecer en sus
 * respuestas. Las reglas de un bot concreto NO heredan las de "*", por eso
 * repiten el mismo `disallow`.
 * Para impedir que se use el contenido para ENTRENAR modelos, quitar de esta
 * lista GPTBot, Google-Extended, Applebot-Extended y anthropic-ai.
 */
const aiBots = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiBots, allow: "/", disallow },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
