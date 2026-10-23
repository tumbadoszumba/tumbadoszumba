"use client"

import { SITE } from "@/lib/site"
import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { SellersManager } from "@/components/admin/SellersManager"
import { Tabs,TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [store, setStore] = useState({ phone: "", email: "", street: "" })
  const [storeLoading, setStoreLoading] = useState(true)
  const [storeSaving, setStoreSaving] = useState(false)
  const [storeMessage, setStoreMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/settings/store")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setStore({ phone: data.phoneDisplay, email: data.email, street: data.street }))
      .catch(() => setStoreMessage({ ok: false, text: "No se pudieron cargar los datos de la tienda." }))
      .finally(() => setStoreLoading(false))
  }, [])

  async function saveStore() {
    setStoreSaving(true)
    setStoreMessage(null)
    try {
      const res = await fetch("/api/admin/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      })
      const data = await res.json()
      if (!res.ok) {
        setStoreMessage({ ok: false, text: data.error ?? "No se pudo guardar." })
        return
      }
      setStore({ phone: data.phoneDisplay, email: data.email, street: data.street })
      setStoreMessage({ ok: true, text: "Guardado. El sitio ya muestra los datos nuevos." })
    } catch {
      setStoreMessage({ ok: false, text: "No se pudo guardar." })
    } finally {
      setStoreSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra la configuracion de tu tienda
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="store">Tienda</TabsTrigger>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Cambia entre modo claro y oscuro
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Label>Modo noche / dia</Label>
              <ThemeToggle />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuario</CardTitle>
              <CardDescription>Cuenta de administrador actual</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">admin@tumbadoszumba.com</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacion de la Tienda</CardTitle>
              <CardDescription>
                Configura la informacion basica de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nombre de la tienda</Label>
                  <Input id="storeName" defaultValue={SITE.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Email de contacto</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={store.email}
                    onChange={(e) => setStore({ ...store, email: e.target.value })}
                    disabled={storeLoading}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Telefono / WhatsApp</Label>
                  <Input
                    id="storePhone"
                    value={store.phone}
                    onChange={(e) => setStore({ ...store, phone: e.target.value })}
                    placeholder="+593 96 990 3466"
                    disabled={storeLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Es el mismo número para llamadas y WhatsApp. Cambia en toda la tienda, el carrito, las proformas en PDF y Google.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Direccion (calle)</Label>
                  <Input
                    id="storeAddress"
                    value={store.street}
                    onChange={(e) => setStore({ ...store, street: e.target.value })}
                    disabled={storeLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se muestra junto a {SITE.address.city}, {SITE.address.region}.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Descripcion</Label>
                <Input
                  id="storeDescription"
                  defaultValue="Tu distribuidor de tumbados de gypsum de confianza"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El nombre, la descripción, la ciudad y el horario no se editan aquí porque alimentan el SEO de toda la tienda.
              </p>
              {storeMessage && (
                <p className={storeMessage.ok ? "text-sm text-green-600" : "text-sm text-red-600"}>
                  {storeMessage.text}
                </p>
              )}
              <Button type="button" onClick={saveStore} disabled={storeLoading || storeSaving}>
                <Save className="mr-2 h-4 w-4" />
                {storeSaving ? "Guardando..." : "Guardar datos de la tienda"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zona Horaria y Moneda</CardTitle>
              <CardDescription>
                Configura la zona horaria y moneda de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Zona horaria</Label>
                  <Select defaultValue="america-guayaquil">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-guayaquil">America/Guayaquil (GMT-5) - Ecuador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">Dólares ($ USD)</SelectItem>
                      <SelectItem value="pen">Soles (S/)</SelectItem>
                      <SelectItem value="eur">Euros (€ EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion de Productos</CardTitle>
              <CardDescription>
                Configura como se muestran los productos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar productos agotados</p>
                  <p className="text-sm text-muted-foreground">
                    Los productos sin stock se mostraran como "Agotado"
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar cantidad en stock</p>
                  <p className="text-sm text-muted-foreground">
                    Muestra cuantas unidades quedan disponibles
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Permitir resenas de productos</p>
                  <p className="text-sm text-muted-foreground">
                    Los clientes pueden dejar resenas en productos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Envio</CardTitle>
              <CardDescription>
                Configura las opciones de envio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Costo de envio estandar</Label>
                  <Input type="number" defaultValue="15" />
                </div>
                <div className="space-y-2">
                  <Label>Envío gratis desde ($)</Label>
                  <Input type="number" defaultValue="200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendedores */}
        <TabsContent value="vendedores" className="space-y-6">
          <SellersManager />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones por Email</CardTitle>
              <CardDescription>
                Configura que notificaciones recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos pedidos</p>
                  <p className="text-sm text-muted-foreground">
                    Recibe un email cuando hay un nuevo pedido
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pagos fallidos</p>
                  <p className="text-sm text-muted-foreground">
                    Notificacion cuando un pago falla
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stock bajo</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando un producto tiene poco stock
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos usuarios</p>
                  <p className="text-sm text-muted-foreground">
                    Notificacion cuando se registra un nuevo usuario
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metodos de Pago</CardTitle>
              <CardDescription>
                Habilita o deshabilita metodos de pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tarjetas de credito/debito</p>
                  <p className="text-sm text-muted-foreground">
                    Visa, Mastercard, American Express
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Transferencia bancaria</p>
                  <p className="text-sm text-muted-foreground">
                    Bancos ecuatorianos (Pichincha, Guayaquil, Produbanco)
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Billeteras digitales</p>
                  <p className="text-sm text-muted-foreground">
                    PayPal, Google Pay, Apple Pay
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pago contra entrega</p>
                  <p className="text-sm text-muted-foreground">
                    El cliente paga al recibir el producto
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button: no aplica a Vendedores, esa pestaña guarda cada accion al toque */}
      {activeTab !== "vendedores" && (
        <div className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      )}
    </div>
  )
}
