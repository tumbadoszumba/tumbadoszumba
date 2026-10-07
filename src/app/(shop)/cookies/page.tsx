import { SITE, ADDRESS_SHORT } from "@/lib/site"

export default function CookiesPage() {
  return (
    <div className="min-h-screen py-10 sm:py-16 bg-slate-50/50 dark:bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Política de Cookies
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              1. ¿Qué son las cookies?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Las cookies son pequeños archivos de texto que un sitio web guarda en su dispositivo para recordar información sobre su visita, como sus preferencias o el estado de su sesión.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              2. Cookies que Utilizamos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              En Tumbados Zumba solo utilizamos cookies propias, necesarias para el funcionamiento del sitio:
            </p>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3 ml-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Cookies de sesión / autenticación:</p>
                <p>Mantienen su sesión iniciada mientras navega o compra en el sitio.</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Cookies de preferencias:</p>
                <p>Recuerdan configuraciones como el tema claro u oscuro que eligió.</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Cookies de carrito de compras:</p>
                <p>Guardan temporalmente los productos que agregó mientras navega el sitio.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              No utilizamos cookies de publicidad ni de rastreo de terceros para analítica o marketing.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              3. Cómo Controlar las Cookies
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Puede permitir, bloquear o eliminar las cookies desde la configuración de su navegador. Tenga en cuenta que bloquear las cookies necesarias puede impedir que algunas funciones del sitio, como mantener su sesión iniciada o su carrito de compras, funcionen correctamente.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              4. Cambios a esta Política
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nos reservamos el derecho de modificar esta Política de Cookies en cualquier momento. Los cambios serán efectivos inmediatamente después de su publicación en el sitio web.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              5. Contacto
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Si tiene preguntas sobre esta Política de Cookies, contáctenos en:
            </p>
            <div className="text-sm text-muted-foreground space-y-1 ml-4">
              <p>📧 Email: tumbadoszumba2508@gmail.com</p>
              <p>📱 WhatsApp / Teléfono: {SITE.phoneDisplay}</p>
              <p>📍 Dirección: {ADDRESS_SHORT}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
