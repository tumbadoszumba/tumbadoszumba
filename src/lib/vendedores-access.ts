import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Clave para entrar a Configuracion > Vendedores. Se guarda hasheada en
// AppSetting una vez que el admin la cambia desde el panel; mientras no la
// haya cambiado, se usa VENDEDORES_ACCESS_PIN del .env como texto plano (solo
// para el primer arranque).
const SETTING_KEY = "vendedores_access_pin_hash"

export async function verifyVendedoresAccessPin(pin: string): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
  if (setting) {
    return bcrypt.compare(pin, setting.value)
  }

  const envPin = process.env.VENDEDORES_ACCESS_PIN
  return !!envPin && pin === envPin
}

export async function hasVendedoresAccessPinConfigured(): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
  return !!setting || !!process.env.VENDEDORES_ACCESS_PIN
}

export async function changeVendedoresAccessPin(currentPin: string, newPin: string): Promise<boolean> {
  const ok = await verifyVendedoresAccessPin(currentPin)
  if (!ok) return false

  const hash = await bcrypt.hash(newPin, 10)
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: hash },
    update: { value: hash },
  })
  return true
}
