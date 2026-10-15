import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"


// Routes that require authentication. El carrito (/cart) es público: sin
// sesión se pide nombre y WhatsApp al pedir por WhatsApp (se guarda una
// proforma con código).
const protectedRoutes = ["/profile", "/checkout"]

// Routes only for admin users
const adminRoutes = ["/admin"]

// Routes only for guests (not logged in)
const guestRoutes = ["/login", "/register"]

const proxyHandler = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.role === "ADMIN"

  // Check if the current path matches any protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )

  // Check if the current path matches any admin route
  const isAdminRoute = adminRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )

  // Check if the current path matches any guest route
  const isGuestRoute = guestRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )

  // Construct a stable base URL using headers to avoid Vercel/NextAuth env var issues
  const host = req.headers.get("host") || nextUrl.host
  const protocol = req.headers.get("x-forwarded-proto") || nextUrl.protocol.replace(":", "")
  const baseUrl = `${protocol}://${host}`

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", baseUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to home if accessing admin route without admin role
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", baseUrl))
  }

  // Redirect to home if accessing guest route while logged in
  if (isGuestRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", baseUrl))
  }

  return NextResponse.next()
})

export const proxy = proxyHandler
export default proxyHandler

export const config = {
  // Antes corría en TODAS las páginas (incluida la home pública), lo que
  // significaba descifrar el JWT de sesión en cada visita sin necesitarlo.
  // Ahora solo entra en las rutas que de verdad chequean algo arriba:
  // protectedRoutes, adminRoutes y guestRoutes.
  matcher: ["/profile/:path*", "/checkout/:path*", "/admin/:path*", "/login", "/register"],
}
