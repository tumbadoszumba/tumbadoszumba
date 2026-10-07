import { SITE } from "@/lib/site"

/**
 * Textos de SEO redactados a mano. No inventan datos: salen de lo que la
 * tienda realmente vende y ofrece. Sirven a los buscadores y a las IA, que
 * pueden citar respuestas claras.
 */

export interface CategoryCopy {
  title: string
  h1: string
  description: string
  intro: string[]
}

const where = `${SITE.address.city}, ${SITE.address.country}`

const known: Record<string, CategoryCopy> = {
  gypsum: {
    title: `Placas de yeso (gypsum) en ${where}`,
    h1: `Placas de yeso y gypsum en ${where}`,
    description:
      "Placas de yeso estándar (ST) y resistentes a la humedad (RH), ángulos y accesorios para tumbados y paredes de construcción en seco. Retira en La Troncal o compra en línea con envío dentro de Ecuador.",
    intro: [
      "Aquí encuentras placas de yeso (drywall) para tumbados, cielos rasos y paredes divisorias. La placa estándar (ST) es la más usada en interiores secos; la placa RH, resistente a la humedad, se usa en zonas como baños y cocinas.",
      "Complementa tu obra con ángulos perimetrales y accesorios de instalación. Si no sabes cuánto material necesitas, usa la calculadora de materiales de la tienda.",
    ],
  },
  "cielo-raso--vinil": {
    title: `Cielo raso de PVC y vinil en ${where}`,
    h1: `Cielo raso de PVC y vinil en ${where}`,
    description:
      "Cielo raso de PVC y vinil con sus ángulos y accesorios: un acabado liviano, fácil de limpiar y resistente a la humedad. Compra en línea o retira en La Troncal.",
    intro: [
      "El cielo raso de PVC (vinil) es una opción liviana y fácil de limpiar para techos de viviendas, locales y baños, y se instala sobre estructura con sus ángulos de acabado.",
      "Revisa los productos disponibles y completa tu instalación con ángulos y accesorios. Atendemos pedidos desde La Troncal hacia todo el Ecuador.",
    ],
  },
  herramientas: {
    title: `Herramientas para tumbados y construcción en seco en ${where}`,
    h1: "Herramientas para tumbados y construcción en seco",
    description:
      "Espátulas, tijeras de aviación, brochas, cintas de medir, alambre y accesorios para instalar tumbados y paredes de gypsum. Marcas como Truper, Stanley, Tactix y Wadfow en La Troncal, Ecuador.",
    intro: [
      "Herramientas y accesorios para el instalador: espátulas, tijeras de aviación, brochas, cintas de medir, mezcladores de pintura, alambre galvanizado y recocido, y sujeciones.",
      `Trabajamos con marcas reconocidas y atendemos a maestros, constructores y particulares desde ${where}.`,
    ],
  },
  "iluminacion-led": {
    title: `Iluminación LED para tumbados en ${where}`,
    h1: "Iluminación LED para tumbados y cielo raso",
    description:
      "Luminarias y accesorios LED para tumbados de gypsum y cielo raso. Compra en línea o retira en La Troncal, Ecuador.",
    intro: [
      "Iluminación LED pensada para tumbados y cielos rasos: una forma de rematar el acabado de la obra con buena luz y bajo consumo.",
      "Consulta los modelos disponibles o escríbenos por WhatsApp para asesorarte.",
    ],
  },
  luces: {
    title: `Luces y luminarias para tumbados en ${where}`,
    h1: "Luces y luminarias para tumbados",
    description:
      "Luces y luminarias para tumbados y cielo raso. Compra en línea o retira en La Troncal, Ecuador.",
    intro: [
      "Luces y luminarias para complementar tumbados de gypsum y cielo raso en viviendas y locales.",
      "Si tienes dudas sobre qué modelo elegir, escríbenos por WhatsApp.",
    ],
  },
  molduras: {
    title: `Molduras para acabados interiores en ${where}`,
    h1: "Molduras para acabados interiores",
    description:
      "Molduras para dar acabado a tumbados, paredes y esquinas. Compra en línea o retira en La Troncal, Ecuador.",
    intro: [
      "Molduras para remates y acabados decorativos en tumbados, paredes y esquinas.",
      "Combínalas con placas de yeso y cielo raso para terminar tu obra con un acabado limpio.",
    ],
  },
}

export function categoryCopy(slug: string, name: string): CategoryCopy {
  const k = known[slug]
  if (k) return k
  return {
    title: `${name} en ${where}`,
    h1: `${name} en ${where}`,
    description: `${name} para tumbados, cielo raso y construcción en seco. Compra en línea o retira en ${SITE.address.city}, ${SITE.address.region}.`,
    intro: [`Productos de la categoría ${name.toLowerCase()} disponibles en Tumbados Zumba, ${where}.`],
  }
}

/** Preguntas frecuentes (home). Respuestas basadas en lo que la tienda ofrece. */
export const homeFaqs: { q: string; a: string }[] = [
  {
    q: "¿Dónde está Tumbados Zumba?",
    a: `Estamos en ${SITE.address.city}, provincia de ${SITE.address.region}, Ecuador: ${SITE.address.street}. Atendemos ${SITE.hoursText.summary}.`,
  },
  {
    q: "¿Qué productos venden?",
    a: "Placas de yeso (gypsum o drywall) estándar y resistentes a la humedad, cielo raso y paneles de pared de PVC, perfilería metálica, molduras, iluminación LED y herramientas para instalar tumbados y paredes en seco.",
  },
  {
    q: "¿Cuál es la diferencia entre la placa de yeso ST y la RH?",
    a: "La placa estándar (ST) se usa en interiores secos. La placa RH es resistente a la humedad y se recomienda para zonas con humedad controlada, como baños y cocinas.",
  },
  {
    q: "¿Cómo calculo cuánto material necesito para mi tumbado?",
    a: "Usa la calculadora de materiales de la tienda: indicas los metros cuadrados y te sugiere los materiales necesarios para tu obra. También puedes solicitar una proforma.",
  },
  {
    q: "¿Instalan tumbados y paredes de gypsum?",
    a: "Sí. Además de vender el material, ofrecemos instalación de tumbados y paredes de gypsum: visitamos la obra, tomamos las medidas y entregamos un presupuesto con la mano de obra y los materiales por separado.",
  },
  {
    q: "¿Hacen envíos a todo el Ecuador?",
    a: "Sí, atendemos pedidos dentro de Ecuador. El costo del envío se muestra en el carrito antes de pagar; para coordinar entregas grandes puedes escribirnos por WhatsApp.",
  },
]
