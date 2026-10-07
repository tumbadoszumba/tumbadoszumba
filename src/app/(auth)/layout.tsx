import type { Metadata } from "next"
import { noIndexMetadata } from "@/lib/seo"

// Inicio de sesión y registro: sin valor para buscadores
export const metadata: Metadata = noIndexMetadata

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
