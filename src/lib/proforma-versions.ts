import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { ProformaPdfData } from "@/lib/pdf/ProformaPdf"

// Historial de versiones de una proforma: se guardan solo los datos con que se
// generó el PDF (no el archivo). Volver a generar sin cambios no crea versión.

function toStored(data: ProformaPdfData): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(data))
}

// La BD (jsonb) reordena las claves al guardar, así que se comparan con las
// claves ordenadas para no crear una versión nueva cuando nada cambió.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (value && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
    return `{${entries.join(",")}}`
  }
  return JSON.stringify(value)
}

export function fromStored(data: Prisma.JsonValue): ProformaPdfData {
  const d = data as unknown as Omit<ProformaPdfData, "createdAt"> & { createdAt: string }
  return { ...d, createdAt: new Date(d.createdAt) }
}

export async function saveVersionIfChanged(proformaId: string, data: ProformaPdfData) {
  const stored = toStored(data)
  const last = await prisma.proformaVersion.findFirst({
    where: { proformaId },
    orderBy: { version: "desc" },
  })
  if (last && canonical(last.data) === canonical(stored)) return last

  try {
    return await prisma.proformaVersion.create({
      data: {
        proformaId,
        version: (last?.version ?? 0) + 1,
        data: stored,
        total: data.total,
        sellerName: data.sellerName,
        branchName: data.branchName,
      },
    })
  } catch (error) {
    // Dos generaciones a la vez pueden pedir el mismo número de versión; la
    // otra ya la guardó, así que no se pierde nada.
    if ((error as { code?: string })?.code === "P2002") return null
    throw error
  }
}
