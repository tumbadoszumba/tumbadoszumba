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
export function RegisterForm({ ageRequired = false }: { ageRequired?: boolean }) {
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
          {ageRequired && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Para crear tu cuenta, confirma que tienes 18 años o más.
            </p>
          )}
          <GoogleSignInButton requireAge />
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
