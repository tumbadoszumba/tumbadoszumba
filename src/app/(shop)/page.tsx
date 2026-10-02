import { HeroBanner } from "@/components/home/HeroBanner"
import { CategoryGrid } from "@/components/home/CategoryGrid"
import { CategoryMosaic } from "@/components/home/CategoryMosaic"
import { FlashOffers } from "@/components/home/FlashOffers"
import { FeaturedProducts } from "@/components/home/FeaturedProducts"
import { BrandSection } from "@/components/home/BrandSection"
import {
  getBestSellingProducts,
  getOfferProducts,
  getFeaturedProducts,
  getBrands,
} from "@/lib/queries"

// Refresca los datos de la home cada 60s como mínimo, para que un cambio en
// el admin (productos, ofertas, marcas) no quede congelado hasta el próximo
// deploy. La invalidación instantánea por tags llega en una fase posterior.
export const revalidate = 60

export default async function HomePage() {
  // Todas las consultas salen en paralelo; el HTML ya llega con los productos
  const [popular, offers, featured, brands] = await Promise.all([
    getBestSellingProducts(6),
    getOfferProducts(12),
    getFeaturedProducts(8),
    getBrands(),
  ])

  return (
    <>
      {/* Categorías recomendadas */}
      <CategoryGrid products={popular} />

      {/* Banner principal full-bleed (todo el ancho de la pantalla) */}
      <section className="pb-1">
        {/* Proporción 3:1 = la de las imágenes (1920x640): se ven completas, sin recorte */}
        <div className="mx-auto aspect-[3/1] w-full max-w-[1920px]">
          <HeroBanner />
        </div>
      </section>

      {/* Mosaico de categorías + calculadora (popup) */}
      <CategoryMosaic />

      {/* Ofertas flash: solo productos con descuento */}
      <FlashOffers products={offers} />

      <FeaturedProducts products={featured} />
      <BrandSection brands={brands} />
    </>
  )
}
