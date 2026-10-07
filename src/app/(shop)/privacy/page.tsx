import { SITE, ADDRESS_SHORT } from "@/lib/site"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-10 sm:py-16 bg-slate-50/50 dark:bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Política de Privacidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              1. Introducción
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tumbados Zumba ("nosotros", "nuestro" o "la Empresa") respeta la privacidad de nuestros usuarios ("usuario" o "usted"). Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y salvaguardamos su información cuando utiliza nuestro sitio web y servicios.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              2. Información que Recopilamos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Recopilamos información de varias formas, incluyendo:
            </p>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3 ml-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Información Proporcionada Directamente:</p>
                <p>Cuando se registra, realiza una compra, o se comunica con nosotros, podemos recopilar información como nombre, correo electrónico, número de teléfono, dirección de envío y información de pago.</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Información Recopilada Automáticamente:</p>
                <p>Cuando accede a nuestro sitio, recopilamos información sobre su dispositivo, dirección IP, tipo de navegador, páginas visitadas y duración de la visita a través de cookies y tecnologías similares.</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Información de Terceros:</p>
                <p>Podemos recibir información sobre usted de terceros si utiliza servicios externos de autenticación al iniciar sesión.</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              3. Uso de su Información
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Utilizamos la información recopilada para:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 ml-4">
              <li>• Procesar y completar sus compras</li>
              <li>• Enviar comunicaciones sobre sus órdenes, entregas y reembolsos</li>
              <li>• Proporcionar atención al cliente y responder consultas</li>
              <li>• Mejorar nuestro sitio web y servicios</li>
              <li>• Enviar actualizaciones de marketing (con su consentimiento)</li>
              <li>• Cumplir con obligaciones legales y regulatorias</li>
              <li>• Prevenir fraude y mejorar la seguridad</li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              4. Compartir su Información
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              No vendemos, alquilamos ni compartimos su información personal con terceros para propósitos de marketing directo sin su consentimiento. Sin embargo, compartimos información con:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 ml-4">
              <li>• Proveedores de servicios que nos ayudan a operar el sitio (como procesadores de pago)</li>
              <li>• Autoridades legales cuando sea requerido por ley</li>
              <li>• Socios comerciales para cumplir con sus solicitudes</li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              5. Seguridad de la Información
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet es 100% seguro, y no podemos garantizar la seguridad absoluta.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              6. Cookies y Tecnologías Similares
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Utilizamos cookies y tecnologías similares para:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 ml-4">
              <li>• Recordar sus preferencias y configuraciones</li>
              <li>• Entender cómo utiliza nuestro sitio</li>
              <li>• Proporcionar funcionalidades personalizadas</li>
              <li>• Análisis y mejora del sitio</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Puede controlar las cookies a través de la configuración de su navegador.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              7. Retención de Datos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conservamos su información personal durante el tiempo que sea necesario para cumplir con los propósitos para los cuales fue recopilada o según lo requiera la ley. Cuando ya no sea necesaria, la eliminaremos de manera segura o la desidentificaremos.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              8. Sus Derechos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Dependiendo de su ubicación, puede tener los siguientes derechos:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 ml-4">
              <li>• Derecho a acceder a sus datos personales</li>
              <li>• Derecho a corregir información inexacta</li>
              <li>• Derecho a solicitar la eliminación de sus datos</li>
              <li>• Derecho a optar por no recibir comunicaciones de marketing</li>
              <li>• Derecho a portabilidad de datos</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Puede eliminar su cuenta y sus datos directamente desde "Mi cuenta → Configuración → Eliminar cuenta". Para el resto de estos derechos, o si prefiere hacerlo por este medio, contáctenos en: tumbadoszumba2508@gmail.com
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              9. Enlaces a Terceros
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nuestro sitio web puede contener enlaces a sitios web de terceros. No somos responsables por las prácticas de privacidad de estos sitios. Le recomendamos revisar sus políticas de privacidad antes de proporcionar cualquier información personal.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              10. Cambios a esta Política
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. Los cambios serán efectivos inmediatamente después de su publicación en el sitio web. Su uso continuado del sitio después de tales modificaciones constituye su aceptación de los cambios.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              11. Contacto
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Si tiene preguntas sobre esta Política de Privacidad o nuestras prácticas de privacidad, contáctenos en:
            </p>
            <div className="text-sm text-muted-foreground space-y-1 ml-4">
              <p>📧 Email: tumbadoszumba2508@gmail.com</p>
              <p>📱 WhatsApp / Teléfono: {SITE.phoneDisplay}</p>
              <p>📍 Dirección: {ADDRESS_SHORT}</p>
            </div>
          </section>

          <section className="rounded-xl border border-brand-orange/20 bg-brand-orange/5 p-6 sm:p-8 mt-8">
            <p className="text-xs text-muted-foreground text-center">
              Al continuar utilizando Tumbados Zumba, usted acepta nuestra Política de Privacidad y Términos de Servicio.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
