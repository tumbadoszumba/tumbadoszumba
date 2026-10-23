import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { CACHE_TAGS } from "@/lib/cache-tags"
import {
  DEFAULT_INSTALLATIONS_IMAGES,
  mergeInstallationsImages,
  type InstallationsImages,
} from "@/lib/installations-images"

// Se guarda como JSON en AppSetting (no necesita migración).
export const INSTALLATIONS_IMAGES_SETTING_KEY = "installations_images"

/** Fotos vigentes de /instalaciones; con caché que se invalida al guardar en el admin. */
export const getInstallationsImages = unstable_cache(
  async (): Promise<InstallationsImages> => {
    try {
      const row = await prisma.appSetting.findUnique({ where: { key: INSTALLATIONS_IMAGES_SETTING_KEY } })
      if (!row) return DEFAULT_INSTALLATIONS_IMAGES
      return mergeInstallationsImages(JSON.parse(row.value))
    } catch {
      return DEFAULT_INSTALLATIONS_IMAGES
    }
  },
  ["installations-images"],
  { tags: [CACHE_TAGS.installationsImages], revalidate: 300 }
)
