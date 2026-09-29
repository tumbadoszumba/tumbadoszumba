// Datos fijos de la empresa que se imprimen en la proforma en PDF.
export const COMPANY = {
  name: "Tumbados Zumba",
  logoUrl:
    "https://res.cloudinary.com/dxkmtbde/image/upload/v1789965816/basictech/media/general/k3h6czmntzzzyszyr2qo.png",
  ruc: "0954583936001",
  phone: "+593 96 990 3466",
  email: "tumbadoszumba2508@gmail.com",
  address: "Av. 25 de Agosto y Galápagos, La Troncal, Cañar, Ecuador",
  web: "tumbadoszumba.com",
} as const

// Días de validez de la proforma desde su fecha de generación.
export const PROFORMA_VALIDITY_DAYS = 3
