"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DEFAULT_INSTALLATIONS_IMAGES, type InstallationsImages } from "@/lib/installations-images"

type Key = keyof InstallationsImages

const FIELDS: { key: Key; title: string; help: string }[] = [
  { key: "storeImage", title: "Foto de «Nuestra tienda»", help: "Lado izquierdo del comparador (el local)." },
  { key: "workImage", title: "Foto de «Tu obra»", help: "Lado derecho del comparador (un tumbado terminado)." },
]

/** Recomendado para que no se vea borrosa en pantallas grandes. */
const MIN_WIDTH = 1200

export function InstallationsImagesCard() {
  const [images, setImages] = useState<InstallationsImages>(DEFAULT_INSTALLATIONS_IMAGES)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<Key | null>(null)
  const [saving, setSaving] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const inputs = useRef<Partial<Record<Key, HTMLInputElement | null>>>({})

  useEffect(() => {
    fetch("/api/admin/settings/installations")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: InstallationsImages) => setImages(data))
      .catch(() => setMessage({ ok: false, text: "No se pudieron cargar las fotos." }))
      .finally(() => setLoading(false))
  }, [])

  async function upload(key: Key, file: File | undefined) {
    if (!file) return
    setUploading(key)
    setMessage(null)
    setWarning(null)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al subir la imagen")
      setImages((prev) => ({ ...prev, [key]: data.url }))
      if (data.width && data.width < MIN_WIDTH) {
        setWarning(`La foto mide ${data.width}×${data.height} px: en pantallas grandes se verá borrosa. Usa una de al menos ${MIN_WIDTH} px de ancho.`)
      }
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Error al subir la imagen" })
    } finally {
      setUploading(null)
      const input = inputs.current[key]
      if (input) input.value = ""
    }
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/settings/installations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(images),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "No se pudo guardar." })
        return
      }
      setImages(data)
      setMessage({ ok: true, text: "Guardado. /instalaciones ya muestra las fotos nuevas." })
    } catch {
      setMessage({ ok: false, text: "No se pudo guardar." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotos de la página de Instalaciones</CardTitle>
        <CardDescription>
          Las dos imágenes del comparador de la parte de arriba de /instalaciones. JPG, PNG o WebP, máx. 5 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, title, help }) => (
            <div key={key} className="space-y-2">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{help}</p>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                {!loading && (
                  <Image src={images[key]} alt={title} fill sizes="400px" className="object-cover" />
                )}
                {uploading === key && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || uploading !== null}
                  onClick={() => inputs.current[key]?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Cambiar foto
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading || uploading !== null || images[key] === DEFAULT_INSTALLATIONS_IMAGES[key]}
                  onClick={() => setImages((prev) => ({ ...prev, [key]: DEFAULT_INSTALLATIONS_IMAGES[key] }))}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Foto original
                </Button>
                <input
                  ref={(el) => {
                    inputs.current[key] = el
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => upload(key, e.target.files?.[0])}
                />
              </div>
            </div>
          ))}
        </div>

        {warning && <p className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>}
        {message && <p className={message.ok ? "text-sm text-green-600" : "text-sm text-red-600"}>{message.text}</p>}
        <p className="text-xs text-muted-foreground">Elegir una foto no la publica: falta pulsar «Guardar fotos».</p>
        <Button type="button" onClick={save} disabled={loading || saving || uploading !== null}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Guardando..." : "Guardar fotos"}
        </Button>
      </CardContent>
    </Card>
  )
}
