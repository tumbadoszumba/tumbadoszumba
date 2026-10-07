import { SITE, ADDRESS_SHORT } from "@/lib/site"

export default function TermsPage() {
  return (
    <div className="min-h-screen py-10 sm:py-16 bg-slate-50/50 dark:bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Términos de Servicio
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              1. Aceptación de Términos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al acceder y utilizar el sitio web de Tumbados Zumba, usted acepta estar vinculado por estos Términos de Servicio. Si no está de acuerdo con cualquier parte de estos términos, le pedimos que no utilice nuestro sitio web. Nos reservamos el derecho de modificar estos términos en cualquier momento, siendo su responsabilidad revisar periodicamente los cambios.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              2. Uso de la Plataforma
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Usted se compromete a utilizar Tumbados Zumba únicamente para propósitos legales y de la manera que no infrinja los derechos de terceros ni restrinja su uso y disfrute. La conducta prohibida incluye:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 ml-4">
              <li>• Acosar o causar vergüenza, angustia o molestia a cualquier persona</li>
              <li>• Transmitir contenido obsceno u ofensivo</li>
              <li>• Interrumpir el flujo normal de diálogo dentro de nuestro sitio web</li>
              <li>• Intentar acceder a sistemas de manera no autorizada</li>
              <li>• Usar la plataforma para actividades comerciales no autorizadas</li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              3. Productos y Precios
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tumbados Zumba se esfuerza por mantener información precisa sobre los productos y precios. Sin embargo, no garantizamos la precisión de descripciones, precios o disponibilidad. Nos reservamos el derecho de limitar cantidades y descontinuar cualquier producto sin previo aviso. Los precios están sujetos a cambio sin notificación previa.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              4. Órdenes y Pagos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Al realizar una compra, usted acepta proporcionar información precisa y actual. Tumbados Zumba se reserva el derecho de rechazar o cancelar cualquier orden. El pago debe ser recibido antes del envío de los productos, excepto cuando se acuerda lo contrario.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Los pagos se procesan de manera segura a través de sistemas autorizados. Al completar una transacción, usted acepta todas las políticas de pago y privacidad de nuestros proveedores de servicios de pago.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              5. Envíos y Entregas
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Los tiempos de entrega son estimados y no garantizados. Tumbados Zumba no es responsable de retrasos causados por factores externos. El riesgo de pérdida o daño de los productos pasa al comprador una vez que el producto ha sido entregado.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para cualquier inconveniente con la entrega, comuníquese con nuestro equipo de atención al cliente dentro de los 5 días hábiles posteriores a la entrega.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              6. Devoluciones y Reembolsos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Las devoluciones deben solicitarse dentro de 15 días después de la entrega. Los productos deben estar en condiciones originales. Tumbados Zumba evaluará cada solicitud de devolución de manera individual. Los reembolsos se procesarán dentro de 10 días hábiles después de recibir y verificar el producto devuelto.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              7. Limitación de Responsabilidad
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              EN LA MEDIDA PERMITIDA POR LA LEY, TUMBADOSZUMBA NO SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS. NUESTRA RESPONSABILIDAD TOTAL NO EXCEDERÁ EL MONTO PAGADO POR USTED EN LA TRANSACCIÓN EN CUESTIÓN.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              8. Propiedad Intelectual
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Todo el contenido del sitio web de Tumbados Zumba, incluyendo textos, gráficos, logos, imágenes y software, son propiedad de Tumbados Zumba o de sus proveedores de contenido y está protegido por leyes internacionales de derechos de autor. Usted no puede reproducir, distribuir o transmitir contenido sin autorización previa escrita.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              9. Legislación Aplicable
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estos Términos de Servicio se rigen por las leyes de la República del Ecuador, sin considerar sus conflictos de disposiciones legales. Usted se somete irrevocablemente a la jurisdicción exclusiva de los tribunales ubicados en Ecuador.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              10. Contacto
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Si tiene preguntas sobre estos Términos de Servicio, comuníquese con nosotros en:
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
