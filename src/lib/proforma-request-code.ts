import { randomInt } from "crypto"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const CODE_ATTEMPTS = 5

// Código corto que viaja en el mensaje de WhatsApp para que el vendedor
// encuentre la solicitud en el admin (ej. TZ-48213). Es aleatorio para no
// revelar cuántas proformas se reciben; la unicidad la garantiza el índice
// único de la BD.
export function generateRequestCode(): string {
  return `TZ-${randomInt(10000, 100000)}`
}

// Crea la proforma con un código nuevo; si choca con uno existente, reintenta
// con otro. La usan la calculadora, el carrito y el admin (vendedores).
export async function createProformaWithCode(
  data: Omit<Prisma.ProformaUncheckedCreateInput, "requestCode">
) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.proforma.create({
        data: { ...data, requestCode: generateRequestCode() },
      })
    } catch (error) {
      const isCodeTaken = (error as { code?: string })?.code === "P2002"
      if (!isCodeTaken || attempt >= CODE_ATTEMPTS) throw error
    }
  }
}
