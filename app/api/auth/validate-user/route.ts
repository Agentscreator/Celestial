// app/api/auth/validate-user/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ valid: false, reason: "No session" }, { status: 401 })
    }

    // Check if user exists in database
    const user = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, parseInt(session.user.id)))
      .limit(1)

    if (!user || user.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        reason: "User not found in database",
        userId: session.user.id 
      }, { status: 404 })
    }

    return NextResponse.json({ valid: true, userId: session.user.id })
  } catch (error) {
    console.error("❌ Error validating user:", error)
    return NextResponse.json({ 
      valid: false, 
      reason: "Database error" 
    }, { status: 500 })
  }
}