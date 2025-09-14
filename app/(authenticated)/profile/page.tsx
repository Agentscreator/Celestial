"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

export default function ProfileRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    const handleRedirect = async () => {
      if (status === "loading") return // Still loading session
      
      if (status === "unauthenticated" || !session?.user) {
        // Automatically sign out and redirect to login
        signOut({ callbackUrl: "/login" })
        return
      }

      if (session?.user?.id && !validating) {
        setValidating(true)
        
        try {
          // Validate user exists in database before redirecting
          const response = await fetch("/api/auth/validate-user")
          const data = await response.json()
          
          if (!data.valid) {
            console.log("❌ User validation failed during profile redirect:", data.reason)
            signOut({ callbackUrl: "/login" })
            return
          }
          
          // User is valid, redirect to their profile
          router.push(`/profile/${session.user.id}`)
        } catch (error) {
          console.error("❌ Error validating user during profile redirect:", error)
          signOut({ callbackUrl: "/login" })
        }
      }
    }

    handleRedirect()
  }, [session, status, router, validating])

  if (status === "loading" || validating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          {status === "loading" ? "Loading..." : "Validating user..."}
        </div>
      </div>
    )
  }

  return null // Component will redirect
}