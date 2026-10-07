import { HeroBanner } from "@/components/home/HeroBanner"
import { CategoryGrid } from "@/components/home/CategoryGrid"
import { CategoryMosaic } from "@/components/home/CategoryMosaic"
import { FlashOffers } from "@/components/home/FlashOffers"
import { FeaturedProducts } from "@/components/home/FeaturedProducts"
import { BrandSection } from "@/components/home/BrandSection"
import { SeoIntro } from "@/components/home/SeoIntro"
import type { Metadata } from "next"
import {
  getBestSellingProducts,
  getOfferProducts,
  getFeaturedProducts,
  getBrands,
  getCategories,
} from "@/lib/queries"
import { SITE, absoluteUrl } from "@/lib/site"

// El título y la descripción vienen del layout raíz; aquí solo se fija el canonical
export const metadata: Metadata = { alternates: { canonical: absoluteUrl("/") } }

// Refresca los datos de la home cada 60s como mínimo, para que un cambio en
// el admin (productos, ofertas, marcas) no quede congelado hasta el próximo
// deploy. La invalidación instantánea por tags llega en una fase posterior.
export const revalidate = 60

export default async function HomePage() {
  // Todas las consultas salen en paralelo; el HTML ya llega con los productos
  const [popular, offers, featured, brands, categories] = await Promise.all([
    getBestSellingProducts(6),
    getOfferProducts(12),
    getFeaturedProducts(8),
    getBrands(),
    getCategories(),
  ])

  return (
    <>
      {/* Título principal de la página para buscadores y lectores de pantalla (no se ve en el diseño) */}
      <h1 className="sr-only">
        {SITE.name}: gypsum, cielo raso PVC y acabados en {SITE.address.city}, {SITE.address.country}
      </h1>

      {/* Categorías recomendadas */}
      <CategoryGrid products={popular} />

      {/* Banner principal full-bleed (todo el ancho de la pantalla) */}
      <section className="pb-1">
        {/* Proporción 5:1 (1920x384): el alto crece con el ancho, así la imagen llena la pantalla de lado a lado sin recortes */}
        <div className="mx-auto aspect-[5/1] w-full max-w-[1920px]">
          <HeroBanner />
        </div>
      </section>

      {/* Mosaico de categorías + calculadora (popup) */}
      <CategoryMosaic />

      {/* Ofertas flash: solo productos con descuento */}
      <FlashOffers products={offers} />

      <FeaturedProducts products={featured} />
      <BrandSection brands={brands} />

      {/* Texto de presentación y preguntas frecuentes (SEO local e IA) */}
      <SeoIntro categories={categories} />
    </>
  )
}
