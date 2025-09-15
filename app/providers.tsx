// app/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import { AppPermissionsProvider } from "@/components/AppPermissionsProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppPermissionsProvider>
        {children}
      </AppPermissionsProvider>
      <Toaster />
    </SessionProvider>
  )
}