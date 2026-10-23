import type { Metadata } from "next"
import { SITE } from "@/lib/site"
import { getStoreContact } from "@/lib/store-contact.server"
import { addressLine } from "@/lib/store-contact"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Derechos de autor y agente DMCA",
  description:
    "Cómo notificar a Tumbados Zumba un contenido que infringe derechos de autor y datos del agente designado (DMCA).",
  path: "/derechos-de-autor",
})

const section = "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8"
const h2 = "text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4"
const p = "text-sm text-muted-foreground leading-relaxed"

// Página del agente designado (DMCA, 17 U.S.C. § 512(c)). Los mismos datos del
// agente deben registrarse en el directorio de copyright.gov.
export default async function CopyrightPage() {
  const contact = await getStoreContact()
  return (
    <div className="min-h-screen py-10 sm:py-16 bg-slate-50/50 dark:bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Derechos de Autor (DMCA)
          </h1>
          <p className="text-sm text-muted-foreground">
            Cómo avisarnos si un contenido de este sitio infringe sus derechos de autor.
          </p>
        </div>

        <div className="space-y-6">
          <section className={section}>
            <h2 className={h2}>1. Nuestro compromiso</h2>
            <p className={p}>
              {SITE.name} respeta la propiedad intelectual de terceros. Si usted cree que un texto, imagen u otro
              contenido publicado en {SITE.url.replace(/^https?:\/\//, "")} infringe sus derechos de autor, puede
              enviarnos una notificación. Atendemos estas notificaciones conforme a la Ley de Derechos de Autor de la
              Era Digital de EE. UU. (DMCA, 17 U.S.C. § 512) y a la legislación de Ecuador.
            </p>
          </section>

          <section className={section}>
            <h2 className={h2}>2. Agente designado</h2>
            <div className={`${p} space-y-1`}>
              <p>
                <strong>Cargo:</strong> Encargado de derechos de autor
              </p>
              <p>
                <strong>Empresa:</strong> {SITE.name}
              </p>
              <p>
                <strong>Dirección postal:</strong> {addressLine(contact)}
              </p>
              <p>
                <strong>Correo:</strong> {contact.email}
              </p>
              <p>
                <strong>Teléfono:</strong> {contact.phoneDisplay}
              </p>
            </div>
          </section>

          <section className={section}>
            <h2 className={h2}>3. Qué debe incluir la notificación</h2>
            <ol className={`${p} list-decimal ml-5 space-y-1`}>
              <li>Su firma física o electrónica (o la de quien actúe en su nombre).</li>
              <li>La obra protegida que, según usted, se está infringiendo.</li>
              <li>El contenido que infringe y dónde está (enlace exacto de la página).</li>
              <li>Sus datos de contacto: nombre, dirección, teléfono y correo.</li>
              <li>
                Una declaración de que cree de buena fe que el uso no está autorizado por el titular, su agente o la
                ley.
              </li>
              <li>
                Una declaración, bajo pena de perjurio, de que la información es exacta y de que usted es el titular o
                está autorizado a actuar en su nombre.
              </li>
            </ol>
          </section>

          <section className={section}>
            <h2 className={h2}>4. Qué hacemos al recibirla</h2>
            <p className={p}>
              Si la notificación está completa, retiraremos o desactivaremos el contenido y avisaremos a quien lo
              publicó. Esa persona puede enviarnos una contranotificación si cree que fue un error; en ese caso
              podremos restablecer el contenido según lo que establece la ley. Retiraremos de forma definitiva el
              contenido de quienes infrinjan derechos de autor de manera reiterada.
            </p>
          </section>

          <section className={section}>
            <h2 className={h2}>5. Aviso</h2>
            <p className={p}>
              Quien afirme falsamente que un contenido infringe derechos de autor puede ser responsable de los daños
              que cause. Si no está seguro, consulte con un abogado antes de enviar la notificación.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
