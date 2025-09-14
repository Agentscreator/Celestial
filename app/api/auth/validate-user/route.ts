// app/api/auth/validate-user/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Validating user session...")
    const session = await auth()
    
    if (!session?.user?.id) {
      console.log("❌ No session or user ID found")
      return NextResponse.json({ valid: false, reason: "No session" }, { status: 401 })
    }

    console.log("🔍 Session user ID:", session.user.id, "Type:", typeof session.user.id)

    // Check if user exists in database
    // Try both string and integer versions of the ID
    let user
    try {
      // First try as integer
      const userId = parseInt(session.user.id)
      console.log("🔍 Trying integer ID:", userId)
      
      user = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1)
      
      console.log("🔍 Database query result:", user)
    } catch (parseError) {
      console.log("❌ Error parsing user ID as integer:", parseError)
      // If parsing fails, try as string (in case the ID column is varchar)
      user = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, session.user.id as any))
        .limit(1)
    }

    if (!user || user.length === 0) {
      console.log("❌ User not found in database. Session ID:", session.user.id)
      return NextResponse.json({ 
        valid: false, 
        reason: "User not found in database",
        userId: session.user.id 
      }, { status: 404 })
    }

    console.log("✅ User validation successful:", session.user.id)
    return NextResponse.json({ valid: true, userId: session.user.id })
  } catch (error) {
    console.error("❌ Error validating user:", error)
    return NextResponse.json({ 
      valid: false, 
      reason: "Database error",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}