// app/api/debug-users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching all users for debugging...")
    
    // Get all users from database
    const users = await db
      .select({ 
        id: usersTable.id, 
        username: usersTable.username,
        email: usersTable.email 
      })
      .from(usersTable)
      .limit(10) // Limit to first 10 users for safety

    console.log("🔍 Users found in database:", users)

    return NextResponse.json({ 
      users,
      count: users.length,
      message: "Debug: Users in database"
    })
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      message: "Error fetching users"
    }, { status: 500 })
  }
}