"use client"

import { createContext, useContext } from "react"
import { DEFAULT_STORE_CONTACT, type StoreContact } from "@/lib/store-contact"

const StoreContactContext = createContext<StoreContact>(DEFAULT_STORE_CONTACT)

/** Entrega a los componentes de cliente el teléfono, correo y calle vigentes. */
export function StoreContactProvider({ value, children }: { value: StoreContact; children: React.ReactNode }) {
  return <StoreContactContext.Provider value={value}>{children}</StoreContactContext.Provider>
}

export function useStoreContact() {
  return useContext(StoreContactContext)
}
