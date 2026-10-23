/**
 * Fotos del comparador «Nuestra tienda → Tu obra» de /instalaciones. El admin
 * las cambia en Configuración → Instalaciones; si no hay ninguna guardada se
 * usan estas.
 */
export interface InstallationsImages {
  storeImage: string
  workImage: string
}

export const DEFAULT_INSTALLATIONS_IMAGES: InstallationsImages = {
  storeImage:
    "https://res.cloudinary.com/dxkmtbde/image/upload/v1788982326/basictech/media/general/jnyg7eq9rcbkzunfppsx.jpg",
  workImage:
    "https://res.cloudinary.com/dxkmtbde/image/upload/v1788982318/basictech/media/general/teeg4tbo7zkdhodkrahk.jpg",
}

/** Solo acepta enlaces https (las fotos se suben a Cloudinary). */
export const isImageUrl = (v: unknown): v is string => typeof v === "string" && /^https:\/\/\S+$/.test(v)

export function mergeInstallationsImages(saved: unknown): InstallationsImages {
  const s = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {}
  return {
    storeImage: isImageUrl(s.storeImage) ? s.storeImage : DEFAULT_INSTALLATIONS_IMAGES.storeImage,
    workImage: isImageUrl(s.workImage) ? s.workImage : DEFAULT_INSTALLATIONS_IMAGES.workImage,
  }
}
