"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2, ListChecks } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ImageUpload } from "@/components/admin/ImageUpload"
import { hasMaxThreeDecimals } from "@/lib/format"

interface UploadedImage {
  url: string
  publicId: string
}

interface SpecItem {
  key: string
  value: string
}

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().min(1, "La descripcion es requerida"),
  price: z.number({ error: "El precio es requerido" }).min(0, "El precio debe ser mayor a 0").refine(hasMaxThreeDecimals, "Máximo 3 decimales (ej. 0.015)"),
  comparePrice: z.number().min(0, "El precio anterior debe ser mayor o igual a 0").refine(hasMaxThreeDecimals, "Máximo 3 decimales (ej. 0.015)").optional(),
  stock: z.number({ error: "El stock es requerido" }).min(0, "El stock debe ser mayor o igual a 0"),
  categoryId: z.string().min(1, "La categoria es requerida"),
  brandId: z.string().optional(),
  isNew: z.boolean(),
  isFeatured: z.boolean(),
  freeShipping: z.boolean(),
  returnPolicy: z.boolean(),
  returnDays: z.number().nullable().optional(),
  warranty: z.boolean(),
  warrantyPeriod: z.string().nullable().optional(),
  showPrice: z.boolean(),
})

type ProductFormData = z.infer<typeof productSchema>

interface Category {
  id: string
  name: string
  slug: string
}

interface Brand {
  id: string
  name: string
  slug: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isOffer, setIsOffer] = useState(false)
  const [showOfferAlert, setShowOfferAlert] = useState(false)
  const [showMissingFieldsAlert, setShowMissingFieldsAlert] = useState(false)
  const [pendingData, setPendingData] = useState<ProductFormData | null>(null)
  const [warrantyOption, setWarrantyOption] = useState<string>("1-mes")
  const [customWarranty, setCustomWarranty] = useState<string>("")
  const [specs, setSpecs] = useState<SpecItem[]>([])

  const addSpec = (defaultKey = "") => {
    setSpecs((prev) => [...prev, { key: defaultKey, value: "" }])
  }

  const updateSpec = (index: number, field: "key" | "value", val: string) => {
    setSpecs((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: val }
      return next
    })
  }

  const removeSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isNew: false,
      isFeatured: false,
      freeShipping: false,
      returnPolicy: false,
      returnDays: 30,
      warranty: false,
      warrantyPeriod: "1 mes",
      stock: 0,
      showPrice: true,
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/brands"),
        ])

        const categoriesData = await categoriesRes.json()
        const brandsData = await brandsRes.json()

        setCategories(categoriesData || [])
        setBrands(brandsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleOfferToggle = (checked: boolean) => {
    if (checked) {
      const comparePrice = watch("comparePrice")
      const showPrice = watch("showPrice")
      if (showPrice && (!comparePrice || Number(comparePrice) <= 0)) {
        setShowOfferAlert(true)
        return
      }
      setIsOffer(true)
    } else {
      setIsOffer(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    if (isOffer && data.showPrice && (!data.comparePrice || Number(data.comparePrice) <= 0)) {
      setShowOfferAlert(true)
      return
    }

    if (!data.brandId) {
      setPendingData(data)
      setShowMissingFieldsAlert(true)
      return
    }

    await saveProduct(data)
  }

  const saveProduct = async (data: ProductFormData) => {
    const returnPolicy = watch("returnPolicy")
    const warranty = watch("warranty")

    // Construir objeto de especificaciones tecnicas
    const specsObject: Record<string, string> = {}
    specs.forEach((item) => {
      const k = item.key.trim()
      const v = item.value.trim()
      if (k && v) {
        specsObject[k] = v
      }
    })

    setSaving(true)
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          freeShipping: !!data.freeShipping,
          returnPolicy: !!returnPolicy,
          returnDays: returnPolicy ? Number(data.returnDays) || 30 : null,
          warranty: !!warranty,
          warrantyPeriod: warranty
            ? warrantyOption === "custom"
              ? customWarranty
              : warrantyOption === "1-mes"
              ? "1 mes"
              : warrantyOption === "3-meses"
              ? "3 meses"
              : warrantyOption === "6-meses"
              ? "6 meses"
              : warrantyOption === "12-meses"
              ? "1 año"
              : customWarranty || "1 mes"
            : null,
          comparePrice: isOffer && data.comparePrice ? data.comparePrice : null,
          images: images.map((img) => img.url),
          specs: specsObject,
          showPrice: data.showPrice,
        }),
      })

      if (!response.ok) throw new Error("Error creating product")

      router.push("/admin/products")
    } catch (error) {
      console.error("Error creating product:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Producto</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo producto al catalogo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informacion Basica</CardTitle>
            <CardDescription>
              Datos principales del producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Nombre del producto"
                  {...register("name", {
                    onChange: (e) => {
                      setValue("slug", generateSlug(e.target.value))
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  placeholder="nombre-del-producto"
                  {...register("slug")}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                placeholder="Descripcion detallada del producto"
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select onValueChange={(value) => setValue("categoryId", value)}>
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Seleccionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandId">Marca (opcional)</Label>
                <Select onValueChange={(value) => setValue("brandId", value)}>
                  <SelectTrigger id="brandId">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brandId && (
                  <p className="text-sm text-destructive">{errors.brandId.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" strokeWidth={1.75} />
                Especificaciones Técnicas
              </CardTitle>
              <CardDescription className="mt-1">
                Añade características detalladas del producto (ej: Medidas, Material, Uso, Espesor...)
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSpec()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
              Añadir especificación
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sugerencias rápidas */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pb-1">
              <span className="font-medium">Sugerencias:</span>
              {["Medidas", "Uso", "Material", "Espesor", "Presentación", "Área", "Color", "Tipo"].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => addSpec(sug)}
                  className="px-2 py-0.5 rounded-md border border-dashed border-border hover:border-primary hover:text-primary transition-colors text-[11px]"
                >
                  + {sug}
                </button>
              ))}
            </div>

            {specs.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground bg-muted/20">
                No hay especificaciones añadidas. Pulsa <strong>Añadir especificación</strong> o una de las sugerencias para comenzar.
              </div>
            ) : (
              <div className="space-y-2.5">
                {specs.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1/3 min-w-[120px]">
                      <Input
                        placeholder="Característica (ej: Medidas)"
                        value={item.key}
                        onChange={(e) => updateSpec(index, "key", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Valor (ej: 1.22 x 2.44 m)"
                        value={item.value}
                        onChange={(e) => updateSpec(index, "value", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeSpec(index)}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio e Inventario</CardTitle>
            <CardDescription>
              Configura precio y disponibilidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Precio ($ USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice">Precio anterior (opcional)</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  {...register("comparePrice", {
                    setValueAs: (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
                  })}
                />
                {errors.comparePrice && (
                  <p className="text-sm text-destructive">{errors.comparePrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  {...register("stock", { valueAsNumber: true })}
                />
                {errors.stock && (
                  <p className="text-sm text-destructive">{errors.stock.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagenes</CardTitle>
            <CardDescription>
              Sube las imagenes del producto (máximo 5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={images}
              onChange={setImages}
              maxImages={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opciones</CardTitle>
            <CardDescription>
              Configuraciones adicionales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isNew"
                checked={watch("isNew")}
                onCheckedChange={(checked) => setValue("isNew", !!checked)}
              />
              <Label htmlFor="isNew" className="font-normal">
                Marcar como producto nuevo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={watch("isFeatured")}
                onCheckedChange={(checked) => setValue("isFeatured", !!checked)}
              />
              <Label htmlFor="isFeatured" className="font-normal">
                Mostrar en productos destacados
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOffer"
                checked={isOffer}
                onCheckedChange={handleOfferToggle}
              />
              <Label htmlFor="isOffer" className="font-normal cursor-pointer">
                Marcar producto en oferta
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPrice"
                checked={watch("showPrice")}
                onCheckedChange={(checked) => setValue("showPrice", !!checked)}
              />
              <Label htmlFor="showPrice" className="font-normal cursor-pointer">
                Mostrar precio (desmarcar para "A consultar")
              </Label>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Envíos, Devoluciones y Garantía</h4>

              {/* Envío Gratis */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="freeShipping"
                  checked={watch("freeShipping")}
                  onCheckedChange={(checked) => setValue("freeShipping", !!checked)}
                />
                <Label htmlFor="freeShipping" className="font-normal cursor-pointer">
                  Aplica Envío Gratis
                </Label>
              </div>

              {/* Devoluciones */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="returnPolicy"
                    checked={watch("returnPolicy")}
                    onCheckedChange={(checked) => setValue("returnPolicy", !!checked)}
                  />
                  <Label htmlFor="returnPolicy" className="font-normal cursor-pointer">
                    Aplica Devoluciones
                  </Label>
                </div>
                {watch("returnPolicy") && (
                  <div className="ml-6 flex items-center gap-2 max-w-xs">
                    <Input
                      id="returnDays"
                      type="number"
                      min={1}
                      placeholder="Días"
                      className="w-24"
                      {...register("returnDays", { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground">días para devolver</span>
                  </div>
                )}
              </div>

              {/* Garantía */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="warranty"
                    checked={watch("warranty")}
                    onCheckedChange={(checked) => setValue("warranty", !!checked)}
                  />
                  <Label htmlFor="warranty" className="font-normal cursor-pointer">
                    Aplica Garantía
                  </Label>
                </div>
                {watch("warranty") && (
                  <div className="ml-6 space-y-2 max-w-sm">
                    <Select
                      value={warrantyOption}
                      onValueChange={(val) => {
                        setWarrantyOption(val)
                        if (val === "1-mes") setValue("warrantyPeriod", "1 mes")
                        else if (val === "3-meses") setValue("warrantyPeriod", "3 meses")
                        else if (val === "6-meses") setValue("warrantyPeriod", "6 meses")
                        else if (val === "12-meses") setValue("warrantyPeriod", "1 año")
                      }}
                    >
                      <SelectTrigger id="warrantyPeriodSelect">
                        <SelectValue placeholder="Seleccionar tiempo de garantía" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-mes">1 mes</SelectItem>
                        <SelectItem value="3-meses">3 meses</SelectItem>
                        <SelectItem value="6-meses">6 meses</SelectItem>
                        <SelectItem value="12-meses">1 año (12 meses)</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    {warrantyOption === "custom" && (
                      <Input
                        placeholder="Ej. 2 años, 18 meses, 5 años..."
                        value={customWarranty}
                        onChange={(e) => {
                          setCustomWarranty(e.target.value)
                          setValue("warrantyPeriod", e.target.value)
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Producto"
            )}
          </Button>
        </div>
      </form>

      {/* Alerta si intenta marcar oferta sin precio anterior */}
      <AlertDialog open={showOfferAlert} onOpenChange={setShowOfferAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Precio anterior requerido</AlertDialogTitle>
            <AlertDialogDescription>
              Debes poner un precio anterior mayor a 0 en la sección de &quot;Precio e Inventario&quot; para poder marcar esta opción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowOfferAlert(false)
                setTimeout(() => {
                  const input = document.getElementById("comparePrice")
                  input?.focus()
                }, 100)
              }}
            >
              Ingresar precio anterior
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Aviso si faltan campos recomendados para mostrar la tarjeta del producto */}
      <AlertDialog open={showMissingFieldsAlert} onOpenChange={setShowMissingFieldsAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Faltan campos recomendados</AlertDialogTitle>
            <AlertDialogDescription>
              Para que este producto se muestre correctamente en las tarjetas de la tienda, completa estos campos: Marca. Puedes guardarlo así de todas formas y completarlo después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowMissingFieldsAlert(false)
                setPendingData(null)
              }}
            >
              Volver a editar
            </Button>
            <AlertDialogAction
              onClick={async () => {
                setShowMissingFieldsAlert(false)
                if (pendingData) {
                  await saveProduct(pendingData)
                  setPendingData(null)
                }
              }}
            >
              Guardar de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
