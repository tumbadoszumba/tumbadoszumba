import { RegisterForm } from "@/components/auth/RegisterForm"
import { AuthLogo } from "@/components/auth/AuthLogo"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ edad?: string }>
}) {
  // ?edad=1: quiso crear una cuenta con Google sin confirmar su edad.
  const { edad } = await searchParams
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-[360px] flex-col gap-6">
        <AuthLogo />
        <RegisterForm ageRequired={edad === "1"} />
      </div>
    </div>
  )
}

