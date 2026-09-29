import bcrypt from "bcryptjs"

export const PIN_REGEX = /^\d{6}$/

export function isValidPin(pin: string) {
  return PIN_REGEX.test(pin)
}

export function hashPin(pin: string) {
  return bcrypt.hash(pin, 10)
}

export function verifyPin(pin: string, pinHash: string) {
  return bcrypt.compare(pin, pinHash)
}

// Genera una clave de 6 dígitos al azar para prellenar el formulario cuando
// se crea un vendedor (el admin puede cambiarla antes de guardar).
export function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}
