import { OffersPageClient } from "@/components/products/OffersPageClient"
import { getListedProducts } from "@/lib/queries"

export default async function OffersPage() {
  // Las ofertas van en el HTML (título, H1 y productos), no solo por JavaScript
  const initialProducts = await getListedProducts(true)
  return <OffersPageClient initialProducts={initialProducts} />
}
