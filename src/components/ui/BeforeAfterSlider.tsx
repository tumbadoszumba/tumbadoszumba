"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** describe la foto para el texto alternativo, p. ej. "tumbado con luz indirecta" */
  subject?: string;
  /** posición inicial del divisor, en % desde la izquierda */
  initialPosition?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Comparador antes/después con el estilo de ficha técnica de /instalaciones.
 * Con mouse el divisor sigue al puntero; en táctil se arrastra sin bloquear
 * el scroll vertical (touch-action: pan-y). Con teclado se mueve con las
 * flechas a través del range oculto.
 */
export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Antes",
  afterLabel = "Después",
  subject,
  initialPosition = 50,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  priority = false,
  className,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // el mouse lo mueve con solo pasar por encima; el dedo, arrastrando
    if (e.pointerType === "mouse" || e.currentTarget.hasPointerCapture(e.pointerId)) {
      updateFromPointer(e.clientX);
    }
  };

  const alt = (label: string) => (subject ? `${label}: ${subject}` : label);
  const labelClass =
    "pointer-events-none absolute top-3 z-10 bg-slate-950/80 px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em]";

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className={cn(
        "relative h-full w-full cursor-ew-resize touch-pan-y select-none overflow-hidden bg-slate-900",
        "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-brand-orange",
        className
      )}
    >
      <Image
        src={afterSrc}
        alt={alt(afterLabel)}
        fill
        sizes={sizes}
        quality={90}
        priority={priority}
        draggable={false}
        className="object-cover"
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image
          src={beforeSrc}
          alt={alt(beforeLabel)}
          fill
          sizes={sizes}
          quality={90}
          priority={priority}
          draggable={false}
          className="object-cover"
        />
      </div>

      <span className={cn(labelClass, "left-3 text-slate-200")}>{beforeLabel}</span>
      <span className={cn(labelClass, "right-3 text-brand-orange")}>{afterLabel}</span>

      {/* Divisor + manija cuadrada en naranja de marca */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-brand-orange"
        style={{ left: `${position}%` }}
      >
        <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center bg-brand-orange text-slate-950">
          <ChevronsLeftRight className="size-4" strokeWidth={2} />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(position)}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Comparar ${beforeLabel.toLowerCase()} y ${afterLabel.toLowerCase()}`}
        className="sr-only"
      />
    </div>
  );
}
