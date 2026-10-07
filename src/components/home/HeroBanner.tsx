"use client"

import * as React from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

// Banners ya diseñados (1920x640): el texto y la info van dentro de la propia
// imagen, por eso no se superpone contenido ni botones. La misma imagen sirve
// para web y celular.
const slides = [
  {
    id: 1,
    alt: "Tumbados Zumba: placa de yeso estándar, placa de yeso RH y planchas de fibrocemento",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1791260924/basictech/media/general/dmrj4z6xdfpxtzwrc8a0.jpg",
  },
  {
    id: 2,
    alt: "Catálogo de cielos raso y paneles de pared de PVC",
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/v1791350044/basictech/media/general/uo9afrqkji8ts2qqhgkq.png",
  },
  {
    id: 3,
    alt: "Perfilería metálica para cielos rasos y paredes",
    // El PNG trae 72 px transparentes por lado: se recortan desde la URL (c_crop) y se estira al 5:1
    stretch: true,
    image: "https://res.cloudinary.com/dxkmtbde/image/upload/c_crop,x_76,y_0,w_1768,h_384/v1791347598/basictech/media/general/d3blmbjagebd3ghjw3qa.png",
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
                {/* Fondo: la misma imagen ampliada y difuminada para rellenar los lados */}
                <Image
                  src={slide.image}
                  alt=""
                  aria-hidden
                  fill
                  draggable={false}
                  className="object-cover scale-110 blur-2xl brightness-90"
                  sizes="100vw"
                />
                {/* Imagen completa, sin recorte */}
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  draggable={false}
                  className={slide.stretch ? "object-fill" : "object-contain"}
                  priority={slide.id === 1}
                  sizes="(min-width: 1920px) 1920px, 100vw"
                />
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
