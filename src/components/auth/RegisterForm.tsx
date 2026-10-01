"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldDescription } from "@/components/ui/field"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"

// El registro es solo con Google: Google ya verifica el correo, así que no se
// pueden crear cuentas con correos inventados.
export function RegisterForm() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Crea tu cuenta con tu cuenta de Google, es rápido y seguro
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <GoogleSignInButton />
          <FieldDescription className="text-center">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Iniciar Sesión
            </Link>
          </FieldDescription>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Al continuar, aceptas nuestros{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Política de Privacidad
        </Link>
        .
      </FieldDescription>
    </div>
  )
}
