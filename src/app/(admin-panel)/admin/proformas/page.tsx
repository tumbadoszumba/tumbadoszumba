"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, FileText, RefreshCcw, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminStore } from "@/stores/admin-store"

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDIENTE: { label: "Pendiente", className: "bg-yellow-500 text-white" },
  COTIZADA: { label: "Cotizada", className: "bg-blue-500 text-white" },
  ENVIADA: { label: "Enviada", className: "bg-green-600 text-white" },
}

export default function AdminProformasPage() {
  return (
    <Suspense fallback={null}>
      <AdminProformasContent />
    </Suspense>
  )
}

function AdminProformasContent() {
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get("userId") || undefined

  const { proformas, proformasTotal, proformasPendientes, proformasCotizadas, loading, fetchProformas } =
    useAdminStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchProformas({
      status: statusFilter === "all" ? undefined : statusFilter,
      userId: userIdParam,
    })
  }, [statusFilter, userIdParam, fetchProformas])

  const filteredProformas = proformas.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.user.name.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      p.calculator.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proformas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {proformasTotal} solicitudes de proforma
            {userIdParam && " · filtrado por usuario"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            fetchProformas({ status: statusFilter === "all" ? undefined : statusFilter, userId: userIdParam })
          }
          disabled={loading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{proformasTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{proformasPendientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cotizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{proformasCotizadas}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <Input
            placeholder="Buscar por cliente o calculadora..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="COTIZADA">Cotizada</SelectItem>
            <SelectItem value="ENVIADA">Enviada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Calculadora</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Materiales</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && proformas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Cargando proformas...
                  </TableCell>
                </TableRow>
              ) : filteredProformas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" strokeWidth={1.75} />
                    No se encontraron proformas
                  </TableCell>
                </TableRow>
              ) : (
                filteredProformas.map((p) => {
                  const statusInfo = statusConfig[p.status] ?? {
                    label: p.status,
                    className: "bg-gray-400 text-white",
                  }
                  return (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/admin/proformas/${p.id}`} className="block">
                          <p className="font-medium text-sm">{p.user.name}</p>
                          <p className="text-xs text-muted-foreground">{p.user.email}</p>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link href={`/admin/proformas/${p.id}`}>{p.calculator.name}</Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{p.area} m²</TableCell>
                      <TableCell className="font-mono text-sm">{p.itemCount}</TableCell>
                      <TableCell className="text-sm">
                        {p.contactPhone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" strokeWidth={1.75} />
                            {p.contactPhone}
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Número no ingresado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("es-EC", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
