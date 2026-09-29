"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, KeyRound, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Branch } from "@/types"

function randomPin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function SellersManager() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [newBranch, setNewBranch] = useState({ name: "", phone: "", address: "" })
  const [savingBranch, setSavingBranch] = useState(false)
  const [newSeller, setNewSeller] = useState<Record<string, { name: string; pin: string }>>({})
  const [savingSeller, setSavingSeller] = useState<string | null>(null)
  const [lastCreatedPin, setLastCreatedPin] = useState<{ sellerName: string; pin: string } | null>(null)

  async function loadBranches() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/branches")
      if (res.ok) setBranches(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
  }, [])

  async function createBranch() {
    if (!newBranch.name.trim()) return
    setSavingBranch(true)
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || "No se pudo crear el local")
        return
      }
      setNewBranch({ name: "", phone: "", address: "" })
      await loadBranches()
    } finally {
      setSavingBranch(false)
    }
  }

  async function deleteBranch(id: string) {
    if (!confirm("¿Eliminar este local y todos sus vendedores? Las proformas ya generadas conservan el nombre como historial.")) return
    const res = await fetch(`/api/admin/branches/${id}`, { method: "DELETE" })
    if (res.ok) await loadBranches()
  }

  async function toggleBranchActive(branch: Branch) {
    const res = await fetch(`/api/admin/branches/${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !branch.active }),
    })
    if (res.ok) await loadBranches()
  }

  async function createSeller(branchId: string, branchName: string) {
    const form = newSeller[branchId]
    if (!form?.name.trim() || !/^\d{6}$/.test(form.pin)) {
      alert("Escribe el nombre y una clave de 6 dígitos")
      return
    }
    setSavingSeller(branchId)
    try {
      const res = await fetch(`/api/admin/branches/${branchId}/sellers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || "No se pudo crear el vendedor")
        return
      }
      setLastCreatedPin({ sellerName: form.name, pin: form.pin })
      setNewSeller((s) => ({ ...s, [branchId]: { name: "", pin: randomPin() } }))
      await loadBranches()
      void branchName
    } finally {
      setSavingSeller(null)
    }
  }

  async function deleteSeller(id: string) {
    if (!confirm("¿Eliminar este vendedor? Ya no podrá generar proformas.")) return
    const res = await fetch(`/api/admin/sellers/${id}`, { method: "DELETE" })
    if (res.ok) await loadBranches()
  }

  async function toggleSellerActive(sellerId: string, active: boolean) {
    const res = await fetch(`/api/admin/sellers/${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    if (res.ok) await loadBranches()
  }

  async function resetSellerPin(sellerId: string) {
    const pin = randomPin()
    if (!confirm(`¿Asignar una nueva clave a este vendedor? Será: ${pin}`)) return
    const res = await fetch(`/api/admin/sellers/${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) {
      alert(`Nueva clave: ${pin}. Anótala, no se puede volver a ver.`)
      await loadBranches()
    }
  }

  return (
    <div className="space-y-6">
      {lastCreatedPin && (
        <Card className="border-primary">
          <CardContent className="pt-4 text-sm">
            Vendedor <strong>{lastCreatedPin.sellerName}</strong> creado con clave{" "}
            <strong className="font-mono">{lastCreatedPin.pin}</strong>. Anótala, no se volverá a mostrar.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nuevo local</CardTitle>
          <CardDescription>Crea una sucursal para asignarle vendedores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newBranch.name}
                onChange={(e) => setNewBranch((b) => ({ ...b, name: e.target.value }))}
                placeholder="Ej: Local Centro"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={newBranch.phone}
                onChange={(e) => setNewBranch((b) => ({ ...b, phone: e.target.value }))}
                placeholder="Ej: 0999999999"
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={newBranch.address}
                onChange={(e) => setNewBranch((b) => ({ ...b, address: e.target.value }))}
                placeholder="Ej: Av. Principal y Calle 2"
              />
            </div>
          </div>
          <Button onClick={createBranch} disabled={savingBranch || !newBranch.name.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Crear local
          </Button>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Cargando locales...</p>}

      {!loading && branches.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay locales creados.</p>
      )}

      {branches.map((branch) => (
        <Card key={branch.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Store className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <CardTitle>{branch.name}</CardTitle>
                <CardDescription>
                  {[branch.phone, branch.address].filter(Boolean).join(" · ") || "Sin teléfono ni dirección"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-2 text-sm">
                Activo
                <Switch checked={branch.active} onCheckedChange={() => toggleBranchActive(branch)} />
              </Label>
              <Button variant="ghost" size="icon" onClick={() => deleteBranch(branch.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {branch.sellers.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin vendedores todavía.</p>
            )}
            {branch.sellers.map((seller) => (
              <div key={seller.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="font-medium text-sm">{seller.name}</p>
                  <p className="text-xs text-muted-foreground">{seller.active ? "Activo" : "Inactivo"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => resetSellerPin(seller.id)}>
                    <KeyRound className="mr-1 h-3.5 w-3.5" />
                    Nueva clave
                  </Button>
                  <Switch checked={seller.active} onCheckedChange={(v) => toggleSellerActive(seller.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => deleteSeller(seller.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            <Separator />

            <div className="grid gap-3 sm:grid-cols-3 items-end">
              <div className="space-y-2 sm:col-span-1">
                <Label>Nombre del vendedor</Label>
                <Input
                  value={newSeller[branch.id]?.name ?? ""}
                  onChange={(e) =>
                    setNewSeller((s) => ({ ...s, [branch.id]: { name: e.target.value, pin: s[branch.id]?.pin ?? randomPin() } }))
                  }
                  placeholder="Ej: María López"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label>Clave (6 dígitos)</Label>
                <Input
                  value={newSeller[branch.id]?.pin ?? randomPin()}
                  onChange={(e) =>
                    setNewSeller((s) => ({ ...s, [branch.id]: { name: s[branch.id]?.name ?? "", pin: e.target.value.replace(/\D/g, "").slice(0, 6) } }))
                  }
                  maxLength={6}
                  className="font-mono"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => createSeller(branch.id, branch.name)}
                disabled={savingSeller === branch.id}
                className="sm:col-span-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar vendedor
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
