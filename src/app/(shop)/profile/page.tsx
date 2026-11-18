"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Pencil, Check, X, Eye, EyeOff, LogOut, AlertCircle, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStore } from "@/stores/user-store"

function FeedbackMessage({ type, message }: { type: "success" | "error"; message: string }) {
  if (!message) return null
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      type === "success" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"
    }`}>
      {type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 text-center sm:text-left">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const { orders, fetchOrders } = useUserStore()

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
    }
  }, [session, fetchOrders])

  if (status === "loading") {
    return <ProfileSkeleton />
  }

  const user = session?.user

  const stats = {
    totalOrders: orders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalSpent: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0),
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const handleStartEdit = () => {
    setEditName(user?.name || "")
    setEditPhone((user as { phone?: string })?.phone || "")
    setEditing(true)
    setProfileFeedback(null)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setProfileFeedback(null)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar")
      }
      await updateSession()
      setProfileFeedback({ type: "success", message: "Perfil actualizado correctamente" })
      setEditing(false)
    } catch (err) {
      setProfileFeedback({ type: "error", message: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    setPasswordFeedback(null)
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", message: "La contraseña debe tener al menos 6 caracteres" })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "Las contraseñas no coinciden" })
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al cambiar la contraseña")
      }
      setPasswordFeedback({ type: "success", message: "Contraseña actualizada correctamente" })
      setChangingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPasswordFeedback({ type: "error", message: (err as Error).message })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pedidos</CardDescription>
            <CardTitle className="text-2xl">{stats.totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedidos Entregados</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.delivered}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Gastado</CardDescription>
            <CardTitle className="text-2xl">$ {stats.totalSpent.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Administra tu información personal</CardDescription>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                <Check className="mr-1 h-4 w-4" />
                {saving ? "..." : "Guardar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {profileFeedback && <FeedbackMessage type={profileFeedback.type} message={profileFeedback.message} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              {editing ? (
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              ) : (
                <Input value={user?.name || ""} readOnly className="bg-muted" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input value={user?.email || ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              {editing ? (
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+593 99 999 9999"
                />
              ) : (
                <Input
                  value={(user as { phone?: string })?.phone || "Sin teléfono"}
                  readOnly
                  className="bg-muted"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Administra la seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordFeedback && <FeedbackMessage type={passwordFeedback.type} message={passwordFeedback.message} />}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Contraseña</p>
              <p className="text-sm text-muted-foreground">
                Cambia tu contraseña regularmente
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => { setChangingPassword(!changingPassword); setPasswordFeedback(null) }}
            >
              {changingPassword ? "Cancelar" : "Cambiar"}
            </Button>
          </div>

          {changingPassword && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label>Contraseña actual</Label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nueva contraseña</Label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar nueva contraseña</Label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                />
              </div>
              <Button onClick={handleSavePassword} disabled={savingPassword} className="w-full">
                {savingPassword ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticación de dos factores</p>
              <p className="text-sm text-muted-foreground">
                Próximamente disponible
              </p>
            </div>
            <Button variant="outline" disabled>
              Próximamente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cerrar Sesión */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
