"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

// Banners ya diseñados (1920x640): el texto y la info van dentro de la propia
// imagen, por eso no se superpone contenido ni botones. En pantallas desde 640 px
// (web) se usa `image`; en celular, `mobileImage` (1678x937, proporción propia).
const slides = [
  {
    id: 1,
    alt: "Tumbados Zumba: placa de yeso estándar, placa de yeso RH y planchas de fibrocemento",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1793162478/basictech/media/general/f5ip5d5rpuursmk24zvc.jpg",
    mobileAlt: "Sala moderna con cielo raso de gypsum e iluminación LED",
    mobileTitle: "Dale un nuevo acabado a tus espacios",
    mobileSubtitle: "Gypsum, PVC y materiales para transformar tu proyecto.",
    mobileCta: "Explorar productos",
    mobileHref: "/products",
    mobileImage: "https://res.cloudinary.com/dxkmtbde/image/upload/v1793074482/basictech/media/general/wzm0kqsrqmjk6hnyqd0o.jpg",
  },
  {
    id: 2,
    alt: "Catálogo de cielos raso y paneles de pared de PVC",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1791350044/basictech/media/general/uo9afrqkji8ts2qqhgkq.png",
    mobileAlt: "Cielo raso y paneles de pared WPC efecto madera",
    mobileTitle: "Dale estilo a tus techos y paredes",
    mobileSubtitle: "Cielos rasos y paneles decorativos de PVC.",
    mobileCta: "Explorar paneles de PVC",
    mobileHref: "/categoria/cielo-raso--vinil",
    mobileImage: "https://res.cloudinary.com/dxkmtbde/image/upload/v1793074485/basictech/media/general/huhzi0riasa7xiaxmcfd.jpg",
  },
  {
    id: 3,
    alt: "Perfilería metálica para cielos rasos y paredes",
    // El PNG trae 72 px transparentes por lado: se recortan desde la URL (c_crop) y se estira al 5:1
    stretch: true,
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/c_crop,x_76,y_0,w_1768,h_384/v1791347598/basictech/media/general/d3blmbjagebd3ghjw3qa.png",
    mobileAlt: "Perfilería metálica para cielos rasos y paredes",
    mobileTitle: "La estructura de un buen proyecto",
    mobileSubtitle: "Perfilería metálica para paredes y cielos rasos.",
    mobileCta: "Ver perfilería metálica",
    mobileHref: "/categoria/gypsum",
    mobileImage: "https://res.cloudinary.com/dxkmtbde/image/upload/v1793074488/basictech/media/general/hrf4zdafp5d9ry0xzs0t.jpg",
  },
]

export function HeroBanner() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Carousel
        plugins={[plugin.current]}
        className="w-full h-full [&>[data-slot=carousel-content]]:h-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="h-full">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="h-full">
              <div className="relative h-full w-full overflow-hidden">
                {/* Celular: imagen propia, el contenedor ya tiene su proporción */}
                <Image
                  src={slide.mobileImage}
                  alt={slide.mobileAlt}
                  fill
                  draggable={false}
                  className="object-cover sm:hidden"
                  priority={slide.id === 1}
                  quality={90}
                  sizes="100vw"
                />
                {/* Celular: texto y botón reales sobre la imagen (medidas en vw: el banner ocupa todo el ancho) */}
                <div className="absolute inset-y-0 left-[5.8%] z-10 flex w-[32%] flex-col justify-center sm:hidden">
                  <span className="mb-[2vw] block h-[0.5vw] w-[6vw] rounded-full bg-[#F0531E]" aria-hidden />
                  <p className="text-[3.9vw] font-extrabold leading-[1.04] tracking-tight text-[#0b1330]">{slide.mobileTitle}</p>
                  <p className="mt-[1.4vw] text-[2.5vw] leading-snug text-slate-600">{slide.mobileSubtitle}</p>
                  <Link
                    href={slide.mobileHref}
                    draggable={false}
                    className="mt-[2.6vw] inline-flex w-fit items-center gap-[1vw] rounded-full bg-[#F0531E] whitespace-nowrap px-[2.4vw] py-[1.5vw] text-[2.2vw] font-bold leading-none text-white shadow-[0_0.6vw_1.6vw_rgba(240,83,30,0.35)] active:scale-95"
                  >
                    {slide.mobileCta}
                    <ArrowRight className="size-[3vw]" strokeWidth={2.5} aria-hidden />
                  </Link>
                </div>
                {/* Web: fondo con la misma imagen ampliada y difuminada para rellenar los lados */}
                <Image
                  src={slide.image}
                  alt=""
                  aria-hidden
                  fill
                  draggable={false}
                  className="hidden object-cover scale-110 blur-2xl brightness-90 sm:block"
                  sizes="100vw"
                />
                {/* Web: imagen completa, sin recorte */}
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  draggable={false}
                  className={`hidden sm:block ${slide.stretch ? "object-fill" : "object-contain"}`}
                  priority={slide.id === 1}
                  quality={90}
                  sizes="(min-width: 1920px) 1920px, 100vw"
                />
                {/* Web: texto y botón reales sobre la imagen (mismo diseño que en celular) */}
                {slide.id === 1 && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 hidden w-[48%] bg-gradient-to-r from-white/85 via-white/55 to-transparent sm:block"
                      aria-hidden
                    />
                    <div className="absolute inset-y-0 left-[6%] z-10 hidden w-[34%] flex-col justify-center sm:flex">
                      <span className="mb-[0.9vw] block h-[0.3vw] min-h-[3px] w-[3.5vw] rounded-full bg-[#F47B20]" aria-hidden />
                      <p className="text-[clamp(1.3rem,2.5vw,3rem)] font-bold leading-[1.1] tracking-tight text-[#0b1330]">{slide.mobileTitle}</p>
                      <p className="mt-[0.5vw] text-[clamp(0.8rem,1.3vw,1.6rem)] font-medium leading-snug text-slate-600">{slide.mobileSubtitle}</p>
                      <Link
                        href={slide.mobileHref}
                        draggable={false}
                        className="mt-[1.1vw] inline-flex w-fit items-center gap-[0.6vw] rounded-full bg-[#F47B20] whitespace-nowrap px-[1.6vw] py-[0.8vw] text-[clamp(0.75rem,1.2vw,1.5rem)] font-semibold leading-none text-white shadow-[0_0.4vw_1.2vw_rgba(244,123,32,0.35)] transition hover:brightness-110 active:scale-95"
                      >
                        {slide.mobileCta}
                        <ArrowRight className="size-[1.7vw] min-h-4 min-w-4" strokeWidth={2.5} aria-hidden />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Flechas pegadas a los bordes de la pantalla */}
        <CarouselPrevious className="left-3 lg:left-4 hidden sm:flex size-10 border-0 bg-white/85 text-slate-800 hover:bg-white shadow-lg" />
        <CarouselNext className="right-3 lg:right-4 hidden sm:flex size-10 border-0 bg-white/85 text-slate-800 hover:bg-white shadow-lg" />

        {/* Dots Indicator */}
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, index) => (
            <div
              key={index}
              className="size-2 rounded-full bg-white/50 transition-colors"
            />
          ))}
        </div>
      </Carousel>
    </div>
  )
}
