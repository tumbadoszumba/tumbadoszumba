"use client"

import { useEffect, useState } from "react"
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Eye,
  Trash2,
  Inbox,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/messages")
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Error al cargar mensajes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const markAsRead = async (id: string, isRead: boolean) => {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      })

      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, isRead } : msg))
        )
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, isRead } : null))
        }
      }
    } catch (err) {
      console.error("Error al actualizar lectura:", err)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este mensaje?")) return

    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== id))
        if (selectedMessage && selectedMessage.id === id) {
          setDialogOpen(false)
        }
      }
    } catch (err) {
      console.error("Error al eliminar mensaje:", err)
    }
  }

  const openMessageDetails = (msg: Message) => {
    setSelectedMessage(msg)
    setDialogOpen(true)
    if (!msg.isRead) {
      markAsRead(msg.id, true)
    }
  }

  const unreadTotal = messages.filter((m) => !m.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="size-6 text-brand-orange" strokeWidth={1.75} />
            Mensajes y Consultas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bandeja interna de mensajes enviados por clientes desde la tienda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Mensajes</p>
            <p className="text-2xl font-bold mt-0.5">{messages.length}</p>
          </div>
          <Inbox className="size-6 text-muted-foreground/60" strokeWidth={1.75} />
        </div>

        <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">No Leídos</p>
            <p className="text-2xl font-bold mt-0.5 text-brand-orange">{unreadTotal}</p>
          </div>
          <Mail className="size-6 text-brand-orange/60" strokeWidth={1.75} />
        </div>

        <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Leídos</p>
            <p className="text-2xl font-bold mt-0.5 text-green-600">
              {messages.length - unreadTotal}
            </p>
          </div>
          <CheckCircle className="size-6 text-green-600/60" strokeWidth={1.75} />
        </div>
      </div>

      {/* Messages List / Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <Inbox className="size-10 mx-auto text-muted-foreground/50" strokeWidth={1.75} />
            <p className="text-base font-semibold">No hay mensajes aún</p>
            <p className="text-xs">Los mensajes recibidos en la web aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Remitente</th>
                  <th className="py-3 px-4">Asunto / Motivo</th>
                  <th className="py-3 px-4 hidden md:table-cell">Fecha</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => openMessageDetails(msg)}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      !msg.isRead ? "bg-brand-orange/5 font-medium" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      {msg.isRead ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                          Leído
                        </Badge>
                      ) : (
                        <Badge className="bg-brand-orange hover:bg-brand-orange text-white text-xs font-medium">
                          Nuevo
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {msg.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{msg.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {msg.subject}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs sm:max-w-md">
                        {msg.message}
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleDateString("es-EC", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-foreground"
                          onClick={() => openMessageDetails(msg)}
                        >
                          <Eye className="size-4" strokeWidth={1.75} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          onClick={() => deleteMessage(msg.id)}
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal View */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <Badge variant={selectedMessage.isRead ? "secondary" : "default"}>
                    {selectedMessage.subject}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3.5" strokeWidth={1.75} />
                    {new Date(selectedMessage.createdAt).toLocaleString("es-EC")}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  {selectedMessage.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" strokeWidth={1.75} />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedMessage.email}
                    </span>
                  </div>
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" strokeWidth={1.75} />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {selectedMessage.phone}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Contenido del Mensaje
                  </p>
                  <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      markAsRead(selectedMessage.id, !selectedMessage.isRead)
                    }
                  >
                    {selectedMessage.isRead ? "Marcar no leído" : "Marcar como leído"}
                  </Button>

                  <a
                    href={`mailto:${selectedMessage.email}?subject=Respuesta Tumbados Zumba: ${encodeURIComponent(
                      selectedMessage.subject
                    )}`}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-orange px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-brand-orange/90 transition-colors"
                  >
                    <Mail className="size-4" strokeWidth={1.75} />
                    Responder por correo
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
