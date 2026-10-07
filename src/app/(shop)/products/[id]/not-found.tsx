import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Producto no encontrado</h1>
      <p className="mt-2 text-muted-foreground">
        El producto que buscas no existe o ha sido eliminado.
      </p>
      <Button asChild className="mt-4">
        <Link href="/products">Ver todos los productos</Link>
      </Button>
    </div>
  )
}
