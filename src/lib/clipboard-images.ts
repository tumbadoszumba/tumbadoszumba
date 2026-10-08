// Subir imágenes copiadas (captura, "Copiar imagen" del navegador, WhatsApp,
// Canva) pegándolas con Ctrl+V o con un botón "Pegar imagen".

// Las imágenes copiadas llegan casi siempre como "image.png". Se renombran con
// fecha y hora para poder encontrarlas; un archivo copiado desde el explorador
// conserva su nombre.
export function namePastedImage(file: Blob, index: number, originalName?: string) {
  if (originalName && !/^image\.\w+$/i.test(originalName)) {
    return new File([file], originalName, { type: file.type })
  }
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png"
  const stamp = new Date().toISOString().slice(0, 19).replace("T", "-").replace(/:/g, "")
  const suffix = index > 0 ? `-${index + 1}` : ""
  return new File([file], `pegada-${stamp}${suffix}.${ext}`, { type: file.type })
}

function isTextField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true
  return (
    target instanceof HTMLInputElement &&
    !["file", "checkbox", "radio", "button", "submit"].includes(target.type)
  )
}

// Imágenes de un evento "paste". Si se está escribiendo en un campo de texto y
// lo copiado también trae texto (ej. celdas de Excel, que llegan como texto y
// como imagen), se deja pegar el texto normal.
export function getPastedImages(e: ClipboardEvent): File[] {
  const data = e.clipboardData
  if (!data) return []
  if (isTextField(e.target) && data.types.includes("text/plain")) return []
  return Array.from(data.files)
    .filter((f) => f.type.startsWith("image/"))
    .map((f, i) => namePastedImage(f, i, f.name))
}

// Para el botón "Pegar imagen" (útil en celular, donde no hay Ctrl+V). El
// navegador pide permiso la primera vez; si lo niega, lanza un error.
export async function readClipboardImages(): Promise<File[]> {
  const clipboardItems = await navigator.clipboard.read()
  const images: File[] = []
  for (const item of clipboardItems) {
    const type = item.types.find((t) => t.startsWith("image/"))
    if (!type) continue
    images.push(namePastedImage(await item.getType(type), images.length))
  }
  return images
}
