/**
 * Inserta datos estructurados (schema.org) como JSON-LD.
 * Se escapa "<" para que un texto del catálogo no pueda cerrar el <script>.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
