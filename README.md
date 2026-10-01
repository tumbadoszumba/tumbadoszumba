# TumbadosZumba - E-commerce

E-commerce especializado en gypsum, cielo raso, iluminación y acabados arquitectónicos, construido con **Next.js 16**, **React 19**, **Prisma 7**, **PostgreSQL** y **Tailwind CSS v4**.

---

## 📋 Descripción

**TumbadosZumba** es una plataforma moderna de comercio electrónico diseñada para la venta y cotización de materiales de construcción liviana, sistemas de gypsum, perfiles, placas y acabados de cielo raso.

### Características Principales:
- 🛒 **Tienda pública**: Catálogo con filtros avanzados por categoría y marca, carrito persistente y checkout.
- 👤 **Panel de usuario**: Perfil, gestión de direcciones de entrega e historial de pedidos.
- 🔐 **Autenticación segura**: NextAuth.js v5 con control de acceso basado en roles (ADMIN, USER).
- 🛡️ **Enrutamiento y Seguridad**: Proxy de Next.js 16 (`src/proxy.ts`) para protección de rutas.
- ⚙️ **Panel de administración**: Gestión completa de productos, usuarios, pedidos y calculadoras.
- 🧮 **Calculadoras dinámicas**: Sistema configurable de calculadoras de materiales. Los admins crean/editan sistemas desde el panel, y los usuarios calculan materiales ingresando el área en m².
- 📄 **Proformas en PDF**: Generación de proformas con numeración por local, IVA e información del vendedor (ver [ARQUITECTURA.md](./ARQUITECTURA.md#sistema-de-proformas-)).

---

## 🛠️ Stack Tecnológico

| Tecnología | Rol / Uso |
|------------|-----------|
| **Next.js 16** | Framework fullstack (App Router & Proxy API) |
| **React 19** | Librería de interfaz de usuario |
| **TypeScript** | Tipado estático y robustez |
| **Tailwind CSS v4** | Estilizado moderno y utilitario |
| **shadcn/ui & Radix UI** | Componentes de UI accesibles |
| **Prisma 7 & PostgreSQL** | ORM con driver adapter (`@prisma/adapter-pg`) y base de datos relacional |
| **NextAuth.js v5 (Beta)** | Sistema de autenticación y sesiones |
| **Zustand** | Gestión de estado global (carrito, favoritos, productos, admin) |
| **Stripe** | Pasarela de pagos |

---

## 🚀 Requisitos Previos

- **Node.js**: v18.18+ o v20+
- **PostgreSQL**: Instancia local o en la nube (o Docker)
- **npm** o gestor de paquetes preferido

---

## 📦 Instalación y Configuración

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd "Antony Ecomerce"

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Configura DATABASE_URL, AUTH_SECRET, STRIPE_SECRET_KEY, etc. en tu archivo .env

# 4. Iniciar base de datos con Docker (opcional)
docker-compose up -d

# 5. Ejecutar migraciones de base de datos
npx prisma migrate dev

# 6. Sembrar datos iniciales (categorías, productos y usuario admin)
npm run db:seed
```

---

## 💻 Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

> **Nota sobre el flag `--webpack`**: El script `dev` ejecuta `next dev --webpack` para garantizar total compatibilidad y estabilidad con los plugins de Tailwind CSS v4, fuentes y adaptadores en Next.js 16, evitando posibles errores de caché o compilación experimental con Turbopack.

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 🧮 Sistema de Calculadoras Dinámicas

TumbadosZumba incluye un **sistema completo de calculadoras de materiales** totalmente configurable:

**Para Usuarios:**
- Accesible en la página principal
- Selecciona un sistema constructivo (Gypsum, Cielo Raso, etc.)
- Ingresa el área en metros cuadrados
- Obtiene lista de materiales necesarios calculados automáticamente
- Envía proforma por WhatsApp

**Para Administradores:**
- Panel: `/admin/calculators`
- Crear nuevas calculadoras con múltiples materiales
- Definir rendimiento de cada material (cantidad por m²)
- Editar y eliminar calculadoras en cualquier momento

👉 **[Ver documentación completa: CALCULATORS.md](./CALCULATORS.md)**

---

## 📜 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | `next dev --webpack` | Inicia el servidor de desarrollo con Webpack |
| `npm run build` | `next build` | Compila la aplicación optimizada para producción |
| `npm run start` | `next start` | Inicia el servidor en modo producción |
| `npm run lint` | `eslint` | Ejecuta el linter para comprobar errores de código |
| `npm run db:seed` | `npx tsx prisma/seed.ts` | Inserta datos de prueba en la base de datos |
| `npm run postinstall` | `prisma generate` | Genera los tipos del cliente Prisma tras instalar dependencias |

---

## 📚 Documentación

| Documento | Contenido |
|-----------|-----------|
| **[ARQUITECTURA.md](./ARQUITECTURA.md)** | Documentación técnica completa: stack, modelos de datos, endpoints, reglas de diseño, roadmap |
| **[CALCULATORS.md](./CALCULATORS.md)** | Sistema de calculadoras: guía de uso, API endpoints, ejemplos, configuración |
| **[CLAUDE.md](./CLAUDE.md)** | Guía para desarrollo con Claude Code, reglas del proyecto |

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (shop)/          # Rutas públicas (catálogo, producto, carrito, checkout, perfil)
│   ├── (admin-panel)/   # Rutas y dashboard de administración (/admin)
│   ├── (auth)/          # Páginas de inicio de sesión y registro (/login, /register)
│   └── api/             # API Endpoints (productos, checkout, webhook stripe, admin, etc.)
├── components/
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── layout/          # Header, Footer, Navbar
│   ├── products/        # Tarjetas, filtros y detalle de producto
│   ├── cart/            # Drawer, resumen de compra y botones de pago
│   ├── home/            # Secciones principales de la landing page
│   └── admin/           # Tablas y formularios del panel administrativo
├── data/                # Mock data de apoyo y fallbacks para UI
├── lib/                 # Configuración de Prisma, Auth, Stripe y utilidades
├── proxy.ts             # Proxy de control de acceso y autenticación (Next.js 16)
├── stores/              # Stores globales de Zustand (cart, favorites, products, user, admin)
└── types/               # Definiciones de tipos e interfaces TypeScript
```

---

## 📄 Licencia

MIT
