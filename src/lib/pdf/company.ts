// Datos fijos de la empresa que se imprimen en la proforma en PDF.
import { SITE, ADDRESS_LINE } from "@/lib/site"

export const COMPANY = {
  name: SITE.name,
  logoUrl:
    "https://res.cloudinary.com/dxkmtbde/image/upload/v1789965816/basictech/media/general/k3h6czmntzzzyszyr2qo.png",
  ruc: "0954583936001",
  phone: SITE.phoneDisplay,
  email: SITE.email,
  address: ADDRESS_LINE,
  web: "tumbadoszumba.com",
} as const

// Días de validez de la proforma desde su fecha de generación.
export const PROFORMA_VALIDITY_DAYS = 3
