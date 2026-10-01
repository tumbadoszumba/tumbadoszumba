import { NextResponse } from "next/server"

// El registro con correo y contraseña está deshabilitado: permitía crear
// cuentas con correos inventados. Las cuentas nuevas se crean con Google.
export async function POST() {
  return NextResponse.json(
    { error: "El registro con contraseña está deshabilitado. Usa Google." },
    { status: 403 }
  )
}
