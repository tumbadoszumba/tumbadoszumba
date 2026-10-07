import Link from "next/link"
import { JsonLd } from "@/components/seo/JsonLd"
import { SITE, categoryPath } from "@/lib/site"
import { faqJsonLd } from "@/lib/seo"
import { homeFaqs } from "@/lib/seo-copy"
import type { Category } from "@/types"

/**
 * Texto y preguntas frecuentes de la portada, visibles y en HTML del
 * servidor. Es lo que leen buscadores e IA (que muchas veces no ejecutan
 * JavaScript) para entender qué es la tienda, dónde está y qué ofrece.
 */
export function SeoIntro({ categories }: { categories: Category[] }) {
  const withProducts = categories.filter((c) => c.productCount > 0)

  return (
    <section
      aria-labelledby="seo-intro-title"
      className="container mx-auto px-4 py-10 text-slate-600 dark:text-slate-400"
    >
      <JsonLd data={faqJsonLd(homeFaqs)} />

      <h2
        id="seo-intro-title"
        className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg"
      >
        Tumbados, gypsum y acabados en {SITE.address.city}, {SITE.address.country}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed">
        {SITE.name} es una tienda de materiales para construcción en seco en {SITE.address.city}, provincia de{" "}
        {SITE.address.region}. Vendemos placas de yeso (gypsum o drywall), cielo raso y paneles de pared de PVC,
        perfilería metálica, molduras, iluminación LED y herramientas, y también instalamos tumbados y paredes de
        gypsum. Atendemos pedidos en todo el Ecuador.
      </p>

      {withProducts.length > 0 && (
        <nav aria-label="Categorías" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {withProducts.map((c) => (
              <li key={c.id}>
                <Link
                  href={categoryPath(c.slug)}
                  className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <h2 className="mt-8 text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
        Preguntas frecuentes
      </h2>
      <div className="mt-3 max-w-3xl divide-y divide-slate-200 dark:divide-slate-800">
        {homeFaqs.map((faq) => (
          <details key={faq.q} className="group py-3">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-900 marker:hidden dark:text-white">
              {faq.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
