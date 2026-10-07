"use client"

import { SITE } from "@/lib/site"
import React, { useEffect } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { X, ChevronRight, ArrowRight } from "lucide-react"

import type { Variants } from "framer-motion"

export interface QuotePopupProps {
    isOpen: boolean
    onClose: () => void
    whatsappNumber?: string
    calculatorHref?: string
    offersHref?: string
}

const listContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15,
        },
    },
}

const listItemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
    },
}

export const QuotePopup: React.FC<QuotePopupProps> = ({
    isOpen,
    onClose,
    whatsappNumber = SITE.whatsapp,
    calculatorHref = "#calculadora",
    offersHref = "/ofertas",
}) => {
    // Manejo de tecla ESC para cerrar el modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }

        if (isOpen) {
            document.body.style.overflow = "hidden"
            window.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.body.style.overflow = "unset"
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, onClose])

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        "Hola, me comunico desde la tienda web. Requiero una cotización técnica y cálculo de materiales para mi proyecto."
    )}`

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="quote-popup-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/75 backdrop-blur-[2px]"
                    role="dialog"
                    aria-modal="true"
                >
                    <motion.div
                        key="quote-popup-container"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-[92%] max-w-[340px] sm:max-w-md md:w-full md:max-w-5xl my-auto max-h-[92vh] md:max-h-none flex flex-col mx-auto"
                    >
                        {/* Botón Cerrar Flotante Exterior (Grande, visible y con hover en naranja de marca) */}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar modal"
                            className="absolute -top-9 right-0 sm:-right-12 sm:top-0 z-50 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-neutral-950 text-white border border-neutral-700 hover:bg-[#f25c05] hover:border-[#f25c05] shadow-2xl transition-all duration-200 cursor-pointer rounded-none group"
                        >
                            <X className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
                        </button>

                        <div className="w-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden rounded-none border border-neutral-800 bg-[#0a0a0a] shadow-2xl">
                        {/* ========================================================================= */}
                        {/* COLUMNA IZQUIERDA (46% Desktop): Media & Banners Informativos             */}
                        {/* ========================================================================= */}
                        <div className="w-full md:w-[46%] flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 bg-[#0a0a0a] rounded-none">
                            {/* Sección Superior: Imagen técnica de instalación (Enfocada en los técnicos con object-top) */}
                            <div className="relative w-full h-32 sm:h-36 md:h-72 bg-neutral-900 overflow-hidden shrink-0 rounded-none">
                                <img
                                    src="https://res.cloudinary.com/dxkmtbde/image/upload/v1789277691/basictech/media/general/hj0z8yls40jnyrusodn0.jpg"
                                    alt="Instaladores técnicos realizando montaje de cielorraso"
                                    className="w-full h-full object-cover object-top md:object-center brightness-95 contrast-105 rounded-none"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-85" />
                            </div>

                            {/* Banner Central: Acceso a Calculadora de Materiales (Solo en Desktop) */}
                            <div className="hidden md:block relative p-4 bg-[#0b1c3d] border-t border-b border-blue-900/60 text-white overflow-hidden rounded-none">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 z-10">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="bg-blue-600 text-white font-mono text-[9px] font-bold px-1 py-0.5 uppercase tracking-wider rounded-none">
                                                CALC
                                            </span>
                                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-white">
                                                Calculadora de Materiales
                                            </span>
                                        </div>

                                        <p className="text-[10.5px] leading-relaxed text-blue-100/90 mb-3 font-normal">
                                            Recuerda que puedes usar nuestra calculadora de materiales para hacer cotizaciones exactas sobre lo que necesitas.
                                        </p>

                                        <motion.button
                                            type="button"
                                            onClick={onClose}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f25c05] hover:bg-[#e05200] text-white font-extrabold text-[9.5px] uppercase tracking-wider border border-orange-400 rounded-none transition-colors cursor-pointer"
                                        >
                                            <ChevronRight className="w-3 h-3 stroke-[2]" />
                                            Calculadora de Materiales
                                        </motion.button>
                                    </div>

                                    {/* Iconografía de soporte calculadora */}
                                    <div className="w-24 sm:w-28 shrink-0 flex items-center justify-center pl-1 self-center">
                                        <img
                                            src="https://res.cloudinary.com/dxkmtbde/image/upload/v1789012176/basictech/media/general/nfxz6pdjr7z9uiyuihda.png"
                                            alt="Calculadora de materiales"
                                            className="w-full max-h-24 object-contain drop-shadow-md rounded-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Banner Inferior: Ofertas Flash y Temporizador (Solo en Desktop) */}
                            <div className="hidden md:flex flex-col justify-between p-4 bg-[#000000] border-t border-neutral-900 rounded-none">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-[#d9381e] inline-block rounded-none shrink-0" />
                                            <span className="text-[11px] font-black text-[#d9381e] tracking-wider uppercase">
                                                OFERTAS FLASH
                                            </span>
                                        </div>

                                        {/* Conteo Regresivo Monospace */}
                                        <div className="flex items-center gap-1 text-[9.5px] font-mono text-neutral-300">
                                            <span className="text-[9px] text-neutral-500 uppercase tracking-tight mr-0.5">
                                                Termina en:
                                            </span>
                                            <span className="bg-red-700/90 text-white font-bold px-1 py-0.5 rounded-none">
                                                01d
                                            </span>
                                            <span className="text-neutral-500">:</span>
                                            <span className="bg-red-700/90 text-white font-bold px-1 py-0.5 rounded-none">
                                                08h
                                            </span>
                                            <span className="text-neutral-500">:</span>
                                            <span className="bg-red-700/90 text-white font-bold px-1 py-0.5 rounded-none">
                                                24m
                                            </span>
                                            <span className="text-neutral-500">:</span>
                                            <span className="bg-red-700/90 text-white font-bold px-1 py-0.5 rounded-none">
                                                15s
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-[10.5px] leading-relaxed text-neutral-400">
                                        Aprovecha nuestras ofertas por tiempo limitado. Puedes conseguir hasta un{" "}
                                        <span className="text-white font-bold underline decoration-neutral-600">
                                            30% de descuento
                                        </span>{" "}
                                        en herramientas y acabados seleccionados.
                                    </p>
                                </div>

                                <div className="mt-2.5">
                                    <Link
                                        href={offersHref || "/ofertas"}
                                        onClick={onClose}
                                        className="flex items-center justify-between py-1 border-t border-neutral-900 text-[10px] font-bold tracking-wider text-[#d9381e] hover:text-red-400 uppercase transition-colors rounded-none"
                                    >
                                        <span>VER TODAS LAS OFERTAS FLASH</span>
                                        <ArrowRight className="w-3 h-3 stroke-[2]" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* COLUMNA DERECHA (54% Desktop): Panel Técnico, Beneficios y Acción         */}
                        {/* ========================================================================= */}
                        <div className="w-full md:w-[54%] flex flex-col justify-between bg-[#ffffff] text-neutral-900 rounded-none">
                            {/* Cabecera Superior Técnica */}
                            <div className="flex items-center justify-between px-2.5 py-1 md:px-3.5 md:py-2.5 bg-neutral-950 text-white border-b border-neutral-800 rounded-none">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#f25c05] inline-block rounded-none" />
                                    <span className="font-mono text-[8.5px] md:text-[11px] font-bold tracking-wider uppercase text-neutral-200">
                                        DPTO. TÉCNICO &amp; COTIZACIONES
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 inline-block rounded-none animate-pulse" />
                                        <span className="font-mono text-[8px] md:text-[9.5px] font-bold tracking-tight uppercase text-emerald-400">
                                            ASESORES EN LÍNEA
                                        </span>
                                    </div>

                                    {/* Botón Cerrar */}
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Cerrar modal"
                                        className="p-0.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors rounded-none"
                                    >
                                        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    </button>
                                </div>
                            </div>

                            {/* Contenido Principal & Beneficios */}
                            <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-4 md:p-6">
                                {/* Propuesta de Valor */}
                                <div className="mb-1.5 md:mb-4">
                                    <div className="border-l-2 border-[#f25c05] pl-1.5 md:pl-2.5 mb-0.5 md:mb-1.5 rounded-none">
                                        <span className="font-mono text-[7.5px] md:text-[9.5px] font-bold uppercase tracking-widest text-[#f25c05] block">
                                            CANAL CORPORATIVO &amp; MAYORISTA
                                        </span>
                                    </div>

                                    <h2 className="text-xs sm:text-base md:text-xl font-black text-neutral-950 leading-snug tracking-tight mb-0.5 md:mb-2">
                                        ¿Requiere cotización técnica o cálculo de materiales?
                                    </h2>

                                    <p className="text-[11px] sm:text-[11.5px] text-neutral-600 leading-relaxed font-normal hidden md:block">
                                        Atención directa para contratistas, distribuidores y proyectos particulares. Cálculo de m², despiece y despachos consolidados.
                                    </p>
                                </div>

                                {/* Cascada de Viñetas Técnicas con Framer Motion */}
                                <motion.div
                                    variants={listContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-1 md:space-y-2.5 my-0.5 md:my-auto"
                                >
                                    {/* Viñeta 01 */}
                                    <motion.div
                                        variants={listItemVariants}
                                        className="p-1 md:p-2.5 border border-neutral-200 bg-neutral-50/50 hover:border-neutral-400 transition-colors rounded-none"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <span className="bg-black text-white font-mono text-[7.5px] md:text-[9px] font-bold px-1 py-0.5 rounded-none">
                                                    01
                                                </span>
                                                <span className="text-[8.5px] md:text-[11px] font-extrabold uppercase tracking-tight text-neutral-900">
                                                    CÁLCULO Y CUBICAJE DE OBRA
                                                </span>
                                            </div>
                                            <span className="font-mono text-[7.5px] md:text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                                                PRECISIÓN
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-neutral-600 leading-relaxed pl-6 hidden md:block">
                                            Metraje exacto de paneles PVC, perfiles, fijaciones y accesorios para minimizar desperdicio y costo total.
                                        </p>
                                    </motion.div>

                                    {/* Viñeta 02 */}
                                    <motion.div
                                        variants={listItemVariants}
                                        className="p-1 md:p-2.5 border border-neutral-200 bg-neutral-50/50 hover:border-neutral-400 transition-colors rounded-none"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <span className="bg-black text-white font-mono text-[7.5px] md:text-[9px] font-bold px-1 py-0.5 rounded-none">
                                                    02
                                                </span>
                                                <span className="text-[8.5px] md:text-[11px] font-extrabold uppercase tracking-tight text-neutral-900">
                                                    PRECIOS POR MAYOR Y VOLUMEN
                                                </span>
                                            </div>
                                            <span className="font-mono text-[7.5px] md:text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                                                ESCALA
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-neutral-600 leading-relaxed pl-6 hidden md:block">
                                            Tarifas escalonadas para obras de gran escala y fletes consolidados a nivel nacional con guía técnica.
                                        </p>
                                    </motion.div>

                                    {/* Viñeta 03 */}
                                    <motion.div
                                        variants={listItemVariants}
                                        className="p-1 md:p-2.5 border border-neutral-200 bg-neutral-50/50 hover:border-neutral-400 transition-colors rounded-none"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <span className="bg-black text-white font-mono text-[7.5px] md:text-[9px] font-bold px-1 py-0.5 rounded-none">
                                                    03
                                                </span>
                                                <span className="text-[8.5px] md:text-[11px] font-extrabold uppercase tracking-tight text-neutral-900">
                                                    DISPONIBILIDAD INMEDIATA
                                                </span>
                                            </div>
                                            <span className="font-mono text-[7.5px] md:text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                                EN BODEGA
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-neutral-600 leading-relaxed pl-6 hidden md:block">
                                            Validación inmediata de lotes, acabados y tiempos de despacho garantizados directo desde centro de distribución.
                                        </p>
                                    </motion.div>
                                </motion.div>

                                {/* Acciones del Modal */}
                                <div className="mt-2 md:mt-4 pt-0.5 md:pt-2">
                                    <motion.a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-2 md:py-3 px-2.5 md:px-4 flex items-center justify-center gap-2 md:gap-2.5 bg-[#12826a] hover:bg-[#0e6f5a] active:bg-[#0c5c4a] text-white font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all shadow-sm rounded-none"
                                    >
                                        {/* SVG Oficial de WhatsApp */}
                                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                        </svg>
                                        <span>CONTACTAR ASESOR VÍA WHATSAPP</span>
                                    </motion.a>

                                    <div className="text-center mt-1.5 md:mt-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="text-[8px] md:text-[9.5px] font-bold tracking-widest text-neutral-500 hover:text-neutral-950 uppercase underline decoration-neutral-400 underline-offset-4 transition-colors rounded-none"
                                        >
                                            CONTINUAR EXPLORANDO EL CATÁLOGO
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Pie de Página Técnico */}
                            <div className="px-2 py-1 md:px-3 md:py-2 bg-neutral-100 border-t border-neutral-200 text-center rounded-none">
                                <p className="font-mono text-[7px] md:text-[9px] tracking-wider text-neutral-500 uppercase font-semibold">
                                    ATENCIÓN COMERCIAL INMEDIATA • DESPACHO NACIONAL • SIN COMPROMISO
                                </p>
                            </div>
                        </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default QuotePopup
