# ARQUITECTURA.md - Documentación Completa del Proyecto

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Modelos de Datos](#modelos-de-datos)
4. [Arquitectura de Carpetas](#arquitectura-de-carpetas)
5. [Módulos Principales](#módulos-principales)
6. [Sistema de Calculadoras](#sistema-de-calculadoras)
7. [Sistema de Proformas](#sistema-de-proformas-)
8. [Reglas de Diseño](#reglas-de-diseño)
9. [Roadmap y Fases](#roadmap-y-fases)

---

## Visión General

**TumbadosZumba** es un e-commerce especializado en materiales de construcción liviana (gypsum, cielo raso, iluminación, acabados) construido con arquitectura moderna:

- **Frontend**: Server Components (React 19) con interactividad cliente
- **Backend**: API REST con Route Handlers (Next.js 16)
- **BD**: PostgreSQL con Prisma 7 (adapter-pg)
- **Autenticación**: NextAuth.js v5 con roles (ADMIN, CUSTOMER, MODERATOR)
- **Pagos**: Stripe
- **Estado Global**: Zustand (carrito, favoritos, productos, admin)
- **Estilos**: Tailwind CSS v4 con tokens OKLCH

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Runtime** | Node.js 18.18+ | Entorno de ejecución |
| **Framework** | Next.js 16 | Fullstack (App Router + Proxy) |
| **UI** | React 19 + shadcn/ui | Componentes y UI |
| **Tipado** | TypeScript | Seguridad de tipos |
| **Estilos** | Tailwind CSS v4 + OKLCH | Diseño moderno y accesible |
| **ORM** | Prisma 7 | Acceso a BD |
| **BD** | PostgreSQL | Datos relacionales |
| **Auth** | NextAuth.js v5 | Autenticación y sesiones |
| **Pagos** | Stripe | Procesamiento de pagos |
| **Estado** | Zustand | Store global (cliente) |
| **CLI** | Claude Code | Desarrollo asistido |

---

## Modelos de Datos

### User
```
User
├─ id: string (cuid)
├─ email: string (unique)
├─ password: string (hashed bcrypt)
├─ name: string
├─ phone: string?
├─ avatar: string? (URL)
├─ role: ADMIN | CUSTOMER | MODERATOR
├─ status: ACTIVE | INACTIVE | SUSPENDED
├─ createdAt: datetime
├─ updatedAt: datetime
├─ addresses: Address[]
└─ orders: Order[]
```

### Product
```
Product
├─ id: string (cuid)
├─ name: string
├─ slug: string (unique)
├─ description: string?
├─ price: decimal(10,2)
├─ comparePrice: decimal(10,2)?
├─ stock: int
├─ images: string[] (URLs)
├─ specs: JSON
├─ isNew: boolean
├─ isFeatured: boolean
├─ isActive: boolean
├─ freeShipping: boolean
├─ returnPolicy: boolean
├─ returnDays: int?
├─ warranty: boolean
├─ warrantyPeriod: string?
├─ createdAt: datetime
├─ updatedAt: datetime
├─ categoryId: string
├─ category: Category
├─ brandId: string
├─ brand: Brand
└─ orderItems: OrderItem[]
```

### Category & Brand
```
Category
├─ id, name, slug, icon
├─ products: Product[]

Brand
├─ id, name, slug, logo
└─ products: Product[]
```

### Order & OrderItem
```
Order
├─ id: string (cuid)
├─ orderNumber: string (unique)
├─ status: PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
├─ subtotal, shipping, total: decimal
├─ paymentMethod: string
├─ stripeSessionId: string?
├─ notes: string?
├─ userId: string → User
├─ addressId: string → Address
├─ items: OrderItem[]

OrderItem
├─ id, name, price, quantity, total
├─ orderId → Order
└─ productId → Product
```

### Address
```
Address
├─ id, label, name, phone, address, city, state, zipCode
├─ isDefault: boolean
├─ userId: string → User
└─ orders: Order[]
```

### Calculator (⭐ Nuevo)
```
Calculator
├─ id: string (cuid)
├─ name: string (unique) - "Gypsum (Pared/Tumbado)"
├─ slug: string (unique)
├─ description: string?
├─ area: decimal(10,2) - Área de referencia (m²)
├─ isActive: boolean
├─ createdAt, updatedAt: datetime
└─ materials: CalculatorMaterial[]

CalculatorMaterial
├─ id: string (cuid)
├─ name: string - "Plancha", "Ángulos", etc.
├─ unit: string - "plancha", "und", "caneca"
├─ yield: decimal(10,4) - Cantidad por m²
├─ position: int - Orden en lista
├─ calculatorId: string → Calculator
└─ createdAt, updatedAt: datetime
```

### Message
```
Message
├─ id, name, email, phone?, subject, message
├─ isRead: boolean
└─ createdAt: datetime
```

### Proforma (⭐ Nuevo)
```
Proforma
├─ id: string (cuid)
├─ status: PENDIENTE | COTIZADA | ENVIADA
├─ area: decimal(10,2)
├─ contactName?, contactPhone?, contactEmail?, contactDocument? (RUC/Cédula)
├─ deletedAt?: datetime - papelera (purga automática a los 30 días)
├─ adjustmentType? / adjustmentDirection? / adjustmentValue? - descuento o recargo sobre el total
├─ proformaNumber?: int - correlativo del local, se asigna la primera vez que se genera el PDF
├─ branchId? → Branch, branchName? (copia del nombre al momento de generar)
├─ sellerId? → Seller, sellerName? (copia del nombre al momento de generar)
├─ userId → User, calculatorId → Calculator
└─ items: ProformaItem[]

ProformaItem
├─ id: string (cuid)
├─ name, unit, quantity: decimal, unitPrice?: decimal, position: int
├─ originalUnitPrice?, originalQuantity - valores originales de la calculadora (para "ver original"/"restablecer")
├─ proformaId → Proforma, materialId? → CalculatorMaterial
```

### Branch & Seller (⭐ Nuevo)
Locales físicos y sus vendedores; usados para numerar y firmar las proformas en PDF.
```
Branch
├─ id: string (cuid)
├─ name, phone?, address?
├─ active: boolean
├─ nextProformaNumber: int (default 100000) - contador propio del local
└─ sellers: Seller[], proformas: Proforma[]

Seller
├─ id: string (cuid)
├─ name: string
├─ pinHash: string - clave de 6 dígitos, hasheada (bcrypt)
├─ active: boolean
├─ branchId → Branch
└─ proformas: Proforma[]
```

### AppSetting (⭐ Nuevo)
Valores de configuración simples editables desde el panel (hoy solo la clave de acceso a Vendedores).
```
AppSetting
├─ key: string (id) - ej. "vendedores_access_pin_hash"
├─ value: string
└─ updatedAt: datetime
```

---

## Arquitectura de Carpetas

```
src/
├── app/
│   ├── (admin-panel)/
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx (Dashboard)
│   │       ├── calculators/           ⭐ NUEVO
│   │       │   ├── page.tsx (Listar)
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/edit/page.tsx
│   │       ├── products/
│   │       ├── categories/
│   │       ├── brands/
│   │       ├── orders/
│   │       ├── users/
│   │       ├── messages/
│   │       ├── payments/
│   │       └── settings/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (shop)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Home)
│   │   ├── products/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── profile/
│   │   ├── ofertas/page.tsx
│   │   ├── contacto/page.tsx
│   │   └── instalaciones/page.tsx
│   ├── api/
│   │   ├── calculators/               ⭐ NUEVO
│   │   │   ├── route.ts (GET, POST)
│   │   │   ├── [id]/route.ts (GET, PUT, DELETE)
│   │   │   └── [id]/materials/route.ts (POST, PUT, DELETE)
│   │   ├── products/
│   │   ├── categories/
│   │   ├── brands/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── admin/
│   │   ├── auth/
│   │   └── stripe/
│   ├── globals.css
│   ├── layout.tsx
│   └── icon.png
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── sheet.tsx
│   │   ├── dialog.tsx
│   │   ├── textarea.tsx
│   │   └── ... (shadcn/ui)
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── TopBar.tsx
│   │   ├── MobileNav.tsx
│   │   └── ThemeToggle.tsx
│   ├── home/
│   │   ├── HeroBanner.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── BrandSection.tsx
│   │   ├── PromoSplitSection.tsx (Deprecated)
│   │   └── DynamicCalculatorSection.tsx ⭐ NUEVO
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── filters/
│   │   └── ProductDetail.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   ├── checkout/
│   │   ├── ShippingForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── OrderSummary.tsx
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── StatsCard.tsx
│   │   ├── Table.tsx
│   │   └── Pagination.tsx
│   └── profile/
│       ├── ProfileSidebar.tsx
│       └── ProfileMobileNav.tsx
├── data/
│   ├── mock-products.ts
│   ├── mock-categories.ts
│   ├── mock-brands.ts
│   ├── mock-user.ts
│   └── mock-admin.ts
├── lib/
│   ├── prisma.ts
│   ├── auth.ts (NextAuth config)
│   ├── stripe.ts
│   ├── utils.ts (cn, formatters)
│   └── validations.ts
├── stores/
│   ├── cart.ts (Zustand)
│   ├── favorites.ts
│   ├── products.ts
│   ├── user.ts
│   └── admin.ts
├── types/
│   └── index.ts (Product, Category, Order, Calculator, etc.)
├── middleware.ts (NextAuth + proxies)
├── proxy.ts (Control de acceso)
└── env.ts (Validación de env vars)
```

---

## Módulos Principales

### 1. **Autenticación & Autorización**
- **Provider**: NextAuth.js v5 (Beta)
- **Estrategias**: Credentials (email/password)
- **Roles**: ADMIN, CUSTOMER, MODERATOR
- **Storage**: Database sessions (Prisma adapter)
- **Proxy**: `src/proxy.ts` valida rutas por rol

### 2. **Catálogo de Productos**
- **CRUD**: API `/api/products`
- **Filtros**: Categoría, marca, rango de precio, búsqueda
- **Favoritos**: Store Zustand + persistencia localStorage
- **Detalles**: Ficha completa por producto

### 3. **Carrito y Checkout**
- **Cart Store**: Zustand (persist en localStorage)
- **Checkout**: Formulario de envío + datos de pago
- **Pagos**: Integración con Stripe (Checkout Session)
- **Webhook**: `POST /api/stripe/webhook` para confirmación

### 4. **Panel de Admin**
- **Dashboard**: Estadísticas de ingresos, pedidos, clientes
- **Gestión de Productos**: CRUD completo
- **Gestión de Categorías/Marcas**: CRUD
- **Gestión de Órdenes**: Estado, historial, cancelación
- **Gestión de Usuarios**: Roles, estado, historial
- **Mensajes de Contacto**: Listado, marcar como leído
- **Calculadoras**: ⭐ NUEVO - Crear, editar, eliminar
- **Proformas**: ⭐ NUEVO - Edición, ajustes, PDF, papelera
- **Vendedores**: ⭐ NUEVO - Locales y vendedores (`/admin/settings` → pestaña Vendedores, con clave de acceso)

### 5. **Sistema de Calculadoras** ⭐
Ver [CALCULATORS.md](./CALCULATORS.md) para detalles completos.

**Resumen:**
- Calculadoras configurables desde admin
- Cada calculadora tiene materiales con rendimiento por m²
- Frontend dinámico que carga de la BD
- Cálculo: Cantidad = Área × Rendimiento
- Envío de proforma por WhatsApp

---

## Sistema de Calculadoras

### Endpoints API

```
GET    /api/calculators                    # Listar todas
POST   /api/calculators                    # Crear
GET    /api/calculators/{id}               # Obtener una
PUT    /api/calculators/{id}               # Actualizar
DELETE /api/calculators/{id}               # Eliminar

POST   /api/calculators/{id}/materials     # Agregar material
PUT    /api/calculators/{id}/materials     # Editar material
DELETE /api/calculators/{id}/materials     # Eliminar material
```

### Admin UI

- **URL**: `/admin/calculators`
- **Acciones**: Crear → Editar → Eliminar
- **Formularios**: Página dedicada (no modales)

### Frontend Dinámico

- **Componente**: `DynamicCalculatorSection.tsx`
- **Ubicación**: Página principal (esquina superior izquierda)
- **Flujo**: Selecciona → Ingresa área → Calcula → Envía por WhatsApp

---

## Sistema de Proformas ⭐

Una proforma se crea desde una calculadora (frontend) y se gestiona desde `/admin/proformas`. El PDF final solo se genera eligiendo un **Local** y un **Vendedor**, y escribiendo la clave de 6 dígitos de ese vendedor.

### Endpoints API

```
GET    /api/proformas                          # Crear/listar desde el frontend
GET    /api/admin/proformas                     # Listar (admin)
GET    /api/admin/proformas/{id}                # Detalle con totales
PATCH  /api/admin/proformas/{id}                # Contacto, estado, ajuste de total
DELETE /api/admin/proformas/{id}                # Papelera / borrado definitivo (?permanent=1)
POST   /api/admin/proformas/{id}/restore        # Restaurar de la papelera
POST   /api/admin/proformas/{id}/reset-all      # Restablecer items a sus valores originales
POST   /api/admin/proformas/{id}/items          # Agregar item (producto o manual)
PATCH  /api/admin/proformas/{id}/items/{itemId} # Editar precio/cantidad de un item

POST   /api/admin/proformas/{id}/pdf            # Generar el PDF: body {branchId, sellerId, pin,
                                                 #   blank?, download?, showUnitPrice?, showItemTotal?}

GET    /api/admin/branches                      # Listar locales (con sus vendedores)
POST   /api/admin/branches                      # Crear local
PATCH  /api/admin/branches/{id}                 # Editar / activar-desactivar
DELETE /api/admin/branches/{id}                 # Eliminar (las proformas ya generadas
                                                 #   conservan branchName como historial)
POST   /api/admin/branches/{id}/sellers         # Crear vendedor (name + pin de 6 dígitos)
PATCH  /api/admin/sellers/{id}                  # Editar nombre / activo / resetear clave
DELETE /api/admin/sellers/{id}                  # Eliminar

POST   /api/admin/vendedores-access             # Verificar la clave para entrar al módulo Vendedores
POST   /api/admin/vendedores-access/change      # Cambiarla (pide la clave actual)
```

### PDF (`src/lib/pdf/ProformaPdf.tsx`)

- Generado con **`@react-pdf/renderer`** (no `pdf-lib`): texto real seleccionable, no una imagen.
- **Número de proforma**: correlativo propio de cada local (`Branch.nextProformaNumber`, empieza en 100000); se asigna una sola vez, al generar el PDF por primera vez — volver a generarlo no cambia el número.
- **IVA**: los precios guardados no lo incluyen; el PDF suma 15% sobre el subtotal (± el ajuste de descuento/recargo de la proforma). El total del PDF es mayor al que se ve en el admin (ese sigue sin IVA).
- **Validez**: 3 días desde la fecha de creación.
- Columnas **V. Unitario** y **Total** por material están ocultas por defecto; dos checkboxes en el admin las muestran si hace falta. El resumen de abajo (Subtotal, IVA, Total) siempre se muestra.
- Checkbox para dejar los datos del cliente en blanco (para llenarlos a mano).
- Datos fijos de la empresa (RUC, logo, teléfono) en `src/lib/pdf/company.ts`.

### Locales y Vendedores (`/admin/settings` → pestaña Vendedores)

- El admin crea **Locales** (nombre, teléfono, dirección) y, dentro de cada uno, **Vendedores** (nombre + clave de 6 dígitos). La clave se guarda hasheada (bcrypt) y solo se muestra una vez al crearla o al resetearla ("Nueva clave").
- Entrar a esta pestaña pide una clave de administrador aparte (`src/lib/vendedores-access.ts`): se guarda hasheada en `AppSetting` y se cambia desde un botón dentro del propio módulo (pide la clave actual). Si nunca se ha cambiado, se usa `VENDEDORES_ACCESS_PIN` del `.env` como respaldo inicial.
- La clave de cada vendedor es distinta: solo autoriza generar el PDF a su nombre (no da acceso al panel).

---

## Reglas de Diseño

### Componentes
1. **Server Components por defecto**, `"use client"` solo si hay interactividad
2. **useState** para estado local de UI (filtros, cantidades)
3. **useMemo** para valores computados (productos filtrados/ordenados)
4. **Layouts anidados** para UI compartida (admin, profile)
5. **Mobile-first** con Tailwind (breakpoints: sm, md, lg, xl)

### Formularios
1. **Páginas dedicadas** para crear/editar (no modales)
2. **react-hook-form + Zod** para validación
3. **Route Handlers** para submit (no Server Actions)
4. **Feedback**: Toast notifications o redirect

### Estado Global
1. **Zustand** para cart, favorites, products, user, admin
2. **localStorage** para persistencia (cart, tema, preferencias)
3. **Database sessions** para auth (NextAuth)

### API
1. **Route Handlers** (`/api/**`) para lógica backend
2. **Prisma** para acceso a BD
3. **Tipos TypeScript** para request/response
4. **Validación**: Zod en bodys críticos
5. **Error Handling**: Try/catch con status codes apropiados

### Estilos
1. **Tailwind CSS v4** con tokens OKLCH
2. **dark/light themes** via `next-themes` (class strategy)
3. **Variables CSS** en `globals.css` (--bg-primary, --text-primary, etc.)
4. **cn()** utility para merging classes

### Tipado
1. **TypeScript** siempre, evitar `any`
2. **Interfaces** en `src/types/index.ts` para dominio
3. **Enums** para estados (OrderStatus, UserRole, UserStatus)
4. **Generics** para componentes reutilizables

---

## Roadmap y Fases

### Fase 1: MVP (Actual) ✅
- [x] Autenticación con NextAuth
- [x] Catálogo de productos dinámico
- [x] Carrito y checkout
- [x] Integración Stripe
- [x] Panel de admin básico
- [x] **Sistema de calculadoras dinámicas** ⭐

### Fase 2: Mejoras UX
- [ ] Wishlist / Favoritos mejorado
- [ ] Búsqueda full-text con Postgres
- [ ] Filtros avanzados (rango dinámico, colores)
- [ ] Reviews y ratings de productos
- [ ] Chat en vivo con admin

### Fase 3: Experiencia Admin
- [ ] Dashboard analytics avanzado
- [ ] Reportes CSV/PDF
- [ ] Bulk actions (editar múltiples productos)
- [ ] Emails automáticos (confirmación, envío)
- [ ] Notificaciones en tiempo real

### Fase 4: Marketing & Performance
- [ ] SEO: Sitemaps, meta tags dinámicos, Open Graph
- [ ] Email marketing integration
- [ ] Retargeting / Abandonded cart emails
- [ ] Analytics (Google Analytics, Posthog)
- [ ] Caché y optimización (Redis, CDN)

### Fase 5: Escalabilidad
- [ ] Multi-tenant (múltiples tiendas)
- [ ] Integraciones adicionales (MercadoPago, PayPal, Wompi)
- [ ] Microservicios para inventario
- [ ] GraphQL API alternativa
- [ ] Mobile app (React Native)

---

## Configuración de Entorno

**Requiere `.env.local`:**

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tumbados

# NextAuth
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (opcional para producción)
SMTP_FROM=noreply@tumbadoszumba.com

# Clave para entrar a Configuracion > Vendedores (solo respaldo inicial;
# una vez cambiada desde el panel, se usa la que esta en la BD)
VENDEDORES_ACCESS_PIN=123456

# SEO (ambas opcionales)
# Dominio publico; por defecto https://www.tumbadoszumba.com (ver src/lib/site.ts)
NEXT_PUBLIC_SITE_URL=https://www.tumbadoszumba.com
# Codigo de verificacion de Google Search Console (meta tag)
GOOGLE_SITE_VERIFICATION=
```

## SEO

Los datos del negocio para buscadores (dominio, direccion, telefono, horario, redes) viven en **`src/lib/site.ts`**; los textos por categoria y las preguntas frecuentes en `src/lib/seo-copy.ts`; los metadatos y JSON-LD en `src/lib/seo.ts`.

- `src/app/robots.ts` y `src/app/sitemap.ts`: robots (permite buscadores de IA) y sitemap dinamico.
- `src/app/llms.txt/route.ts`: resumen del negocio en Markdown para asistentes de IA.
- `src/app/opengraph-image.tsx`: imagen por defecto al compartir.
- Fichas (`/products/[slug]`) y categorias (`/categoria/[slug]`) se renderizan en el servidor con JSON-LD. Solo se indexa lo que la tienda muestra (activo y con stock).
- Las paginas privadas (admin, perfil, carrito, checkout, login) llevan `noindex`.

---

## Desarrollo Local

```bash
# Setup
npm install
npx prisma db push
npx prisma db seed

# Dev
npm run dev

# Ver en http://localhost:3000
# Admin: http://localhost:3000/admin
# Calculadoras: http://localhost:3000/admin/calculators
```

---

## Deploy

**Vercel** (recomendado):
```bash
git push origin main
# Auto-deploy en Vercel
# Variables de env en Vercel dashboard
```

**Otros**:
- Railway, Render, Fly.io soportan Next.js 16
- BD en Supabase, Neon, o AWS RDS

---

## Contacto & Soporte

- **Issues**: Reporta bugs en GitHub
- **Docs**: [CALCULATORS.md](./CALCULATORS.md), [CLAUDE.md](./CLAUDE.md)
- **Email**: support@tumbadoszumba.com

---

**Última actualización**: 2026-09-07  
**Versión**: 1.1 (con Sistema de Calculadoras Dinámicas)
