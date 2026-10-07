"use client"

import { SITE, ADDRESS_SHORT } from "@/lib/site"
import { useState } from "react"
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "No se pudo enviar el mensaje")
      }

      setSubmitted(true)
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error al enviar el mensaje. Intente de nuevo.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-slate-50/50 dark:bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Centro de Contacto y Atención
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            ¿Tienes dudas sobre envíos, garantías, cotizaciones o quieres trabajar con nosotros?
            Envíanos un mensaje y nuestro equipo te responderá a la brevedad.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Información de Contacto
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-brand-orange mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Dirección</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {ADDRESS_SHORT}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-5 text-brand-orange mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Teléfono / WhatsApp</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">{SITE.phoneDisplay}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="size-5 text-brand-orange mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Correo Electrónico</p>
                    <p className="text-muted-foreground text-xs sm:text-sm break-all">
                      tumbadoszumba2508@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-brand-orange mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Horario de Atención</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {SITE.hoursText.weekdays}
                      <br />
                      {SITE.hoursText.saturday}
                      <br />
                      {SITE.hoursText.sunday}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner de ayuda rápida */}
            <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/5 p-5">
              <h3 className="text-sm font-semibold text-brand-orange mb-1">
                ¿Preguntas frecuentes o garantías?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Selecciona la opción adecuada en el asunto del formulario para que tu solicitud
                sea priorizada por el área correspondiente.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="mx-auto size-14 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <CheckCircle2 className="size-8" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    ¡Mensaje recibido con éxito!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Gracias por comunicarte con Tumbados Zumba. Hemos registrado tu mensaje y te
                    responderemos lo más pronto posible al correo indicado.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="mt-4"
                  >
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo *</Label>
                      <Input
                        id="name"
                        placeholder="Ej. Juan Pérez"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono / Celular (opcional)</Label>
                      <Input
                        id="phone"
                        placeholder="0991234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Motivo / Asunto *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(val) => setFormData({ ...formData, subject: val })}
                        required
                      >
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Selecciona un motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consulta general">Consulta general</SelectItem>
                          <SelectItem value="Cotización de materiales">Cotización de materiales</SelectItem>
                          <SelectItem value="Envíos y entregas">Envíos y entregas</SelectItem>
                          <SelectItem value="Garantías y devoluciones">Garantías y devoluciones</SelectItem>
                          <SelectItem value="Preguntas frecuentes">Preguntas frecuentes</SelectItem>
                          <SelectItem value="Trabaja con nosotros">Trabaja con nosotros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje *</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Escribe tu mensaje, consulta detallada o requerimiento..."
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  {error && (
                    <div className="p-3 text-xs sm:text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !formData.subject}
                    className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange/90 text-white font-medium flex items-center gap-2"
                  >
                    <Send className="size-4" strokeWidth={1.75} />
                    {loading ? "Enviando mensaje..." : "Enviar mensaje"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
