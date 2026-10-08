"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  ImagePlus,
  Loader2,
  Trash2,
  Copy,
  Check,
  Search,
  ImageOff,
  ClipboardPaste,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getPastedImages, readClipboardImages } from "@/lib/clipboard-images"

interface MediaItem {
  id: string
  name: string
  url: string
  publicId: string
  width: number | null
  height: number | null
  size: number | null
  folder: string
  createdAt: string
}

function formatSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      setLoading(true)
      const res = await fetch("/api/media")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data)
    } catch {
      setError("Error al cargar la biblioteca de medios")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/media", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Error al subir imagen")
        }

        const item = await res.json()
        setItems((prev) => [item, ...prev])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen")
    } finally {
      setUploading(false)
    }
  }, [])

  // Ctrl+V / Cmd+V en cualquier parte de la página sube las imágenes copiadas.
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (uploading) return
      const images = getPastedImages(e)
      if (images.length === 0) return
      e.preventDefault()
      handleUpload(images)
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [handleUpload, uploading])

  async function handlePasteButton() {
    setError(null)
    try {
      const images = await readClipboardImages()
      if (images.length === 0) {
        setError("No hay ninguna imagen copiada. Copia una imagen y vuelve a intentarlo.")
        return
      }
      handleUpload(images)
    } catch {
      setError("El navegador no permitió leer el portapapeles. Prueba pegando con Ctrl+V.")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta imagen? Esta acción no se puede deshacer.")) return

    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch {
      alert("Error al eliminar la imagen")
    }
  }

  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleUpload(e.dataTransfer.files)
    },
    [handleUpload]
  )

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sube y administra las imágenes del sitio (banners, secciones, promociones). Cada imagen
            tiene una URL que puedes copiar y usar donde la necesites.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handlePasteButton}
          disabled={uploading}
          className="shrink-0"
        >
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Pegar imagen
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
      )}

      {/* Zona de subida */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Subiendo imágenes...</p>
          </>
        ) : (
          <>
            <ImagePlus className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Arrastra imágenes aquí o haz clic para seleccionar</p>
            <p className="text-xs text-muted-foreground">
              También puedes copiar una imagen (WhatsApp, Canva, una captura…) y pegarla con{" "}
              <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">Ctrl</kbd>+
              <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">V</kbd>
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP o GIF (máx. 5MB por imagen)</p>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading}
        />
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid de imágenes */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ImageOff className="h-10 w-10 mb-2" />
          <p>{items.length === 0 ? "No hay imágenes subidas todavía" : "Sin resultados"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map((item) => (
            <div key={item.id} className="group rounded-lg border bg-card overflow-hidden">
              <div className="relative aspect-square bg-muted">
                <Image src={item.url} alt={item.name} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-2.5 space-y-1.5">
                <p className="text-xs font-medium truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.width}×{item.height} · {formatSize(item.size)}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={() => handleCopy(item.url, item.id)}
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="mr-1 h-3 w-3" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" /> Copiar URL
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
