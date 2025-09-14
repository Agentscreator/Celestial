// app/(authenticated)/layout.tsx
"use client"
import type React from "react"
import { usePathname } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { StreamProvider } from '@/components/providers/StreamProvider'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { StreamVideoProvider } from "@/components/providers/StreamVideoProvider"
import { MessageNotifications } from "@/components/messages/MessageNotifications"
import { useEffect, useState } from "react"
import { requestNotificationPermission } from "@/utils/sound"
import { useSession, signOut } from "next-auth/react"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isFeedPage = pathname === '/feed'
  const { data: session, status } = useSession()
  const [userValidated, setUserValidated] = useState(false)
  const [validating, setValidating] = useState(false)

  // Global authentication check for authenticated routes
  useEffect(() => {
    if (status === "unauthenticated" || (status !== "loading" && !session?.user)) {
      signOut({ callbackUrl: "/login" })
    }
  }, [status, session])

  // Validate user exists in database after session is confirmed
  useEffect(() => {
    const validateUser = async () => {
      if (status === "authenticated" && session?.user && !userValidated && !validating) {
        setValidating(true)
        try {
          const response = await fetch("/api/auth/validate-user")
          const data = await response.json()
          
          if (!data.valid) {
            console.log("❌ User validation failed:", data.reason)
            signOut({ callbackUrl: "/login" })
            return
          }
          
          setUserValidated(true)
        } catch (error) {
          console.error("❌ Error validating user:", error)
          signOut({ callbackUrl: "/login" })
        } finally {
          setValidating(false)
        }
      }
    }

    validateUser()
  }, [status, session, userValidated, validating])

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Show loading while checking authentication or validating user
  if (status === "loading" || (status === "authenticated" && !userValidated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-lg text-white">
          {status === "loading" ? "Loading..." : "Validating user..."}
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated or user not validated
  if (status === "unauthenticated" || !session?.user || !userValidated) {
    return null
  }

  return (
    <ErrorBoundary>
      <StreamProvider>
        <StreamVideoProvider>
          <div className="flex min-h-screen flex-col md:flex-row bg-black">
            <Navigation />
            <main className="flex-1 pb-20 lg:ml-16 lg:pb-0 pt-16 lg:pt-safe-top px-safe-left px-safe-right bg-black">
              <div className="mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-8">
                {children}
              </div>
            </main>

            {/* Message Notifications */}
            <MessageNotifications />
          </div>
        </StreamVideoProvider>
      </StreamProvider>
    </ErrorBoundary>
  )
}