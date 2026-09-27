"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { DynamicCalculatorSection } from "@/components/home/DynamicCalculatorSection"

interface MosaicCard {
  overline: string
  title: string
  accent: string
  href: string
  image: string
  /** clases de grid: cómo ocupa la celda en móvil y en desktop */
  span: string
  /** ocupa el ancho completo en móvil (card grande) */
  wide?: boolean
  /** paleta de la tarjeta */
  tone: "dark" | "light" | "brand"
  /** ajuste de imagen: cover o contain para verla completa */
  imageFit?: "cover" | "contain"
  /** al hacer clic, cubre la pantalla con una cortina de este color antes de navegar */
  curtain: { bg: string; text: string }
}

const cards: MosaicCard[] = [
  {
    overline: "Lo Nuevo",
    title: "Placas y",
    accent: "GYPSUM",
    href: "/products?category=gypsum",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1788980567/basictech/media/general/p4exapcgkhtif2341fgb.png",
    span: "col-span-1 lg:col-span-3",
    tone: "light",
    curtain: { bg: "#F47B20", text: "#FFFFFF" },
  },
  {
    overline: "Tendencia",
    title: "Insumos y",
    accent: "HERRAMIENTAS",
    href: "/products?category=herramientas",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1789012695/basictech/media/general/nqr6ugugotz6ipyz4rk9.png",
    span: "col-span-2 lg:col-span-6",
    wide: true,
    tone: "brand",
    imageFit: "contain",
    curtain: { bg: "#D93025", text: "#FFFFFF" },
  },
  {
    overline: "En Casa",
    title: "Cielo raso e",
    accent: "ILUMINACIÓN",
    href: "/products?category=luces",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1788980572/basictech/media/general/dynhcky2ymxt5q1c1hd7.png",
    span: "col-span-2 lg:col-span-6",
    wide: true,
    tone: "dark",
    imageFit: "contain",
    curtain: { bg: "#111827", text: "#FFFFFF" },
  },
  {
    overline: "Diseño & Lujo",
    title: "Paneles y",
    accent: "PVC / WPC",
    href: "/products?category=Cielo%20raso-%20vinil",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1788980574/basictech/media/general/miedwrwakgdybexemmb4.png",
    span: "col-span-2 lg:col-span-6",
    wide: true,
    tone: "light",
    imageFit: "contain",
    curtain: { bg: "#F1F5F9", text: "#F47B20" },
  },
]

const toneStyles: Record<
  MosaicCard["tone"],
  { bg: string; overline: string; title: string; accent: string; btn: string }
> = {
  dark: {
    bg: "bg-[#111827] dark:bg-[#0B1220]",
    overline: "text-white/55",
    title: "text-white",
    accent: "text-white/35",
    btn: "bg-brand-orange text-white",
  },
  light: {
    bg: "bg-slate-100 dark:bg-slate-800",
    overline: "text-slate-500 dark:text-slate-400",
    title: "text-slate-900 dark:text-white",
    accent: "text-brand-orange",
    btn: "bg-brand-orange text-white",
  },
  brand: {
    bg: "bg-[#D93025] dark:bg-[#B3251C]",
    overline: "text-white/70",
    title: "text-white",
    accent: "text-white",
    btn: "bg-white text-[#D93025]",
  },
}

export function CategoryMosaic() {
  const router = useRouter()
  const [openCalc, setOpenCalc] = useState(false)
  const [curtainCard, setCurtainCard] = useState<MosaicCard | null>(null)

  function handleCurtainNavigate(card: MosaicCard) {
    if (curtainCard) return
    setCurtainCard(card)
    // navega cuando la cortina ya cubrió toda la pantalla + una pausa breve
    setTimeout(() => router.push(card.href), 650)
  }

  return (
    <section className="container mx-auto px-4 pt-4 pb-3">
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Tarjeta destacada: se expande en su lugar hacia la calculadora (shared layout animation) */}
        <div className="col-span-1 lg:col-span-3 relative h-[150px] sm:h-[178px]">
          {!openCalc && (
            <motion.button
              layoutId="calc-card"
              type="button"
              onClick={() => setOpenCalc(true)}
              className="group absolute inset-0 overflow-hidden text-left"
              style={{
                background: "linear-gradient(160deg, #2E6BFF 0%, #1E4FD6 55%, #0a1a3a 100%)",
                borderRadius: 0,
              }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              transition={{ type: "spring", stiffness: 110, damping: 18 }}
            >
              <div
                className="absolute -right-10 -top-10 size-36 rounded-full pointer-events-none"
                style={{ background: "rgba(255,255,255,0.18)", filter: "blur(28px)" }}
              />
              <div className="absolute -right-3 -bottom-5 sm:-right-2 sm:-bottom-4 w-28 sm:w-36 h-36 sm:h-44 pointer-events-none transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="https://res.cloudinary.com/dxkmtbde/image/upload/v1789012176/basictech/media/general/nfxz6pdjr7z9uiyuihda.png"
                  alt="Calculadora de Materiales"
                  fill
                  sizes="(max-width: 1024px) 140px, 160px"
                  className="object-contain drop-shadow-2xl"
                />
              </div>
              <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
                <span className="text-[11px] font-medium text-white/60">Cotiza al instante</span>
                <h3 className="text-base sm:text-lg font-bold leading-tight text-white">Calculadora de</h3>
                <p className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-white/90">
                  MATERIALES
                </p>
                <span className="mt-auto inline-flex w-fit items-center rounded-full bg-brand-orange px-4 py-1.5 text-xs font-semibold text-white shadow-md">
                  Calcular
                </span>
              </div>
            </motion.button>
          )}
        </div>

        {cards.map((card) => {
          const t = toneStyles[card.tone]
          const cardClassName = `${card.span} group relative overflow-hidden rounded-md h-[150px] sm:h-[178px] ${t.bg} text-left transition-transform hover:-translate-y-0.5`
          const cardContent = (
            <>
              {/* Panel de imagen a la derecha, nítido y visible */}
              <div
                className={`absolute right-2 sm:right-3 top-2 sm:top-3 bottom-2 sm:bottom-3 overflow-hidden rounded-sm ${
                  card.imageFit === "contain"
                    ? "w-[54%] sm:w-[50%] lg:w-[48%]"
                    : card.wide
                    ? "w-[32%] sm:w-[28%]"
                    : "w-[42%] sm:w-[42%]"
                }`}
              >
                <Image
                  src={card.image}
                  alt={card.accent}
                  fill
                  sizes="(max-width: 1024px) 50vw, 360px"
                  className={`${
                    card.imageFit === "contain" ? "object-contain" : "object-cover"
                  } transition-transform duration-300 group-hover:scale-105`}
                />
              </div>

              <div
                className={`relative z-10 flex h-full ${
                  card.imageFit === "contain"
                    ? "w-[46%] sm:w-[50%] lg:w-[52%]"
                    : "w-[58%] sm:w-[56%]"
                } flex-col p-4 sm:p-5`}
              >
                <span className={`text-[11px] font-medium ${t.overline}`}>{card.overline}</span>
                <h3 className={`text-base sm:text-lg font-bold leading-tight ${t.title}`}>{card.title}</h3>
                <p
                  className={`font-extrabold leading-tight tracking-tight ${
                    card.wide ? "text-lg sm:text-2xl" : "text-lg sm:text-xl"
                  } ${t.accent}`}
                >
                  {card.accent}
                </p>
                <span
                  className={`mt-auto inline-flex w-fit items-center rounded-full px-4 py-1.5 text-xs font-semibold shadow-md ${t.btn}`}
                >
                  Explorar
                </span>
              </div>
            </>
          )

          return (
            <button
              key={card.accent}
              type="button"
              onClick={() => handleCurtainNavigate(card)}
              className={cardClassName}
            >
              {cardContent}
            </button>
          )
        })}
      </div>

      {/* Popup de la calculadora: la tarjeta se transforma en este contenedor */}
      <AnimatePresence>
        {openCalc && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36 }}
            style={{ background: "rgba(2,4,10,0.82)", backdropFilter: "blur(5px)" }}
            onClick={() => setOpenCalc(false)}
          >
            <motion.div
              layoutId="calc-card"
              className="relative w-full max-w-sm overflow-hidden"
              style={{ borderRadius: 0 }}
              transition={{ type: "spring", stiffness: 93, damping: 17 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpenCalc(false)}
                className="absolute right-3 top-3 z-20 flex items-center justify-center w-8 h-8 text-white/70 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.1)" }}
                aria-label="Cerrar calculadora"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
              <DynamicCalculatorSection />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cortina de página: entra en diagonal desde el costado con el color de la categoría antes de navegar */}
      <AnimatePresence>
        {curtainCard && (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{
                width: "140%",
                background: curtainCard.curtain.bg,
                skewX: -20,
                transformOrigin: "top left",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.25 }}
            >
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{ color: curtainCard.curtain.text }}
              >
                {curtainCard.accent}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
