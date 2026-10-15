"use client"

import { useEffect } from "react"
import Link from "next/link"
import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStore } from "@/stores/user-store"

const statusConfig = {
  PENDIENTE: { label: "Pendiente", variant: "secondary" as const },
  COTIZADA: { label: "Cotizada", variant: "secondary" as const },
  ENVIADA: { label: "Enviada", variant: "default" as const },
}

function ProformasSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ProformasPage() {
  const { proformas, loading, fetchProformas } = useUserStore()

  useEffect(() => {
    fetchProformas()
  }, [fetchProformas])

  if (loading && proformas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Mis Proformas</h2>
          <p className="text-muted-foreground">Historial de proformas solicitadas</p>
        </div>
        <ProformasSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Mis Proformas</h2>
        <p className="text-muted-foreground">Historial de proformas solicitadas</p>
      </div>

      {proformas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">No tienes proformas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aún no has solicitado ninguna proforma
            </p>
            <Button asChild>
              <Link href="/">Ir a la Calculadora</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proformas.map((proforma) => {
            const status =
              statusConfig[proforma.status as keyof typeof statusConfig] || statusConfig.PENDIENTE
            return (
              <Card key={proforma.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {proforma.source === "CARRITO" ? "Pedido del carrito" : proforma.calculator?.name ?? "Proforma"}
                      </CardTitle>
                      <CardDescription>
                        {proforma.requestCode && `${proforma.requestCode} · `}
                        {new Date(proforma.createdAt).toLocaleDateString("es-EC", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {proforma.area != null && ` · ${proforma.area} m²`}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Separator />
                  <div className="space-y-2">
                    {proforma.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-mono font-medium">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
