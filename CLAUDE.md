# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and AI agents when working with code in this repository.
> 📖 **Para la documentación completa, arquitectura de backend, modelos de datos, endpoints y reglas de diseño, consulta el documento maestro: [ARQUITECTURA.md](./ARQUITECTURA.md)**

## Project Overview

TumbadosZumba is an e-commerce application for dry construction, gypsum, ceilings, and architectural finishes built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma 7, PostgreSQL, and shadcn/ui.

### Component Organization
```
src/components/
├── layout/      # Header, Footer, TopBar, MobileNav, ThemeToggle
├── home/        # HeroBanner, CategoryGrid, FeaturedProducts, BrandSection
├── products/    # ProductCard, ProductGrid, FilterSidebar, filters
├── cart/        # CartItem, CartSummary
├── checkout/    # ShippingForm, PaymentForm, OrderSummary
├── admin/       # AdminSidebar, AdminHeader, StatsCard
├── profile/     # ProfileSidebar, ProfileMobileNav
├── providers/   # ThemeProvider (next-themes wrapper)
└── ui/          # shadcn/ui components
```

### Data Layer
- `src/data/mock-products.ts` - Products, categories, brands
- `src/data/mock-user.ts` - User profile, addresses, orders, favorites
- `src/data/mock-admin.ts` - Admin stats, users, payments
- `src/types/index.ts` - Core interfaces (Product, Category, CartItem, FilterState)

### Styling System
- Tailwind CSS v4 with CSS variables in OKLCH color space
- Dark/light themes via `next-themes` (class strategy)
- Theme variables in `src/app/globals.css`
- Use `cn()` utility from `src/lib/utils.ts` for class merging

### Key Patterns

- Server Components by default, `"use client"` for interactivity
- useState for local UI state (filters, quantities)
- useMemo for computed values (filtered/sorted products)
- Layouts with nested routes for shared UI (admin, profile)
- Mobile-first responsive design with Sheet components for mobile nav

## Configuration

- **Path alias**: `@/*` maps to `./src/*`
- **Images**: Remote patterns configured for `images.unsplash.com`
- **shadcn/ui**: "new-york" style, "neutral" base color, lucide icons

## Project Plan

Consulta [ARQUITECTURA.md](./ARQUITECTURA.md) para el roadmap y fases de implementación.


## Sistema de Calculadoras Dinámicas

Las calculadoras de materiales son **completamente configurables desde el admin**:

- **Admin Panel**: `/admin/calculators` - crear, editar y eliminar calculadoras
- **Frontend Dinámico**: `src/components/home/DynamicCalculatorSection.tsx` carga calculadoras de la BD
- **BD**: Modelos `Calculator` y `CalculatorMaterial` en Prisma
- **API**: Endpoints REST en `/api/calculators/*` para CRUD completo
- **Seed**: `prisma/seed.ts` incluye 5 calculadoras de ejemplo

Ver [CALCULATORS.md](./CALCULATORS.md) para documentación detallada.

## Sistema de Proformas y Vendedores

- **Admin Panel**: `/admin/proformas` - edición, ajustes de precio/total, papelera
- **Locales y vendedores**: `/admin/settings` → pestaña Vendedores (pide una clave de admin aparte, cambiable desde ahí mismo). BD: modelos `Branch`, `Seller`, `AppSetting`
- **Generar PDF**: requiere elegir Local + Vendedor + clave de 6 dígitos del vendedor (`POST /api/admin/proformas/{id}/pdf`); el número de proforma es correlativo por local y solo se asigna una vez
- **PDF**: `src/lib/pdf/ProformaPdf.tsx` con `@react-pdf/renderer` (no `pdf-lib`), IVA 15% aparte, validez 3 días

Ver [ARQUITECTURA.md](./ARQUITECTURA.md#sistema-de-proformas-) para documentación detallada.

## Animaciones (Motion)

Para replicar el patrón "Bento Grid Expandible" (card que se transforma en modal con `layoutId`) o el "Skeleton Loader" (placeholders con shimmer), sigue estrictamente las reglas y plantillas del skill [.claude/skills/motion-bento-skeleton/SKILL.md](./.claude/skills/motion-bento-skeleton/SKILL.md). No improvises variantes nuevas de estos patrones.

## Rules

- Al momento de crear datos nuevos no uses Modales, usa paginas dedicadas para los formularios 
- no uses server actions, usa Route handlers
- para manejo de estado global usa Zustand
- para formularios usar react-hook-form y zod