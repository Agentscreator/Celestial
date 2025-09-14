"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function DebugAuth() {
  const { data: session, status } = useSession()
  const [validationResult, setValidationResult] = useState<any>(null)
  const [usersInDb, setUsersInDb] = useState<any>(null)

  useEffect(() => {
    const debugValidation = async () => {
      if (session?.user) {
        try {
          // Test validation endpoint
          const validationResponse = await fetch("/api/auth/validate-user")
          const validationData = await validationResponse.json()
          setValidationResult(validationData)

          // Get users in database
          const usersResponse = await fetch("/api/debug-users")
          const usersData = await usersResponse.json()
          setUsersInDb(usersData)
        } catch (error) {
          console.error("Debug error:", error)
        }
      }
    }

    debugValidation()
  }, [session])

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl mb-2">Session Status</h2>
          <pre className="bg-gray-800 p-4 rounded">
            {JSON.stringify({ status, session }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl mb-2">Validation Result</h2>
          <pre className="bg-gray-800 p-4 rounded">
            {JSON.stringify(validationResult, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl mb-2">Users in Database</h2>
          <pre className="bg-gray-800 p-4 rounded">
            {JSON.stringify(usersInDb, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}