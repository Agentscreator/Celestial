import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

// Fix missing user in database
export async function POST(request: NextRequest) {
  try {
    console.log("🔧 FIX USER API - Starting...")
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }
    
    console.log("Session user:", {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username
    })
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1)
    
    if (existingUser.length > 0) {
      console.log("✅ User already exists in database")
      return NextResponse.json({
        success: true,
        message: "User already exists",
        user: existingUser[0]
      })
    }
    
    console.log("Creating missing user in database...")
    
    // Create the missing user record
    const newUser = await db
      .insert(usersTable)
      .values({
        id: session.user.id,
        username: session.user.username || session.user.email?.split('@')[0] || 'user',
        nickname: session.user.name || session.user.username || 'User',
        email: session.user.email || '',
        password: 'OAUTH_USER', // Placeholder for OAuth users
        dob: new Date('1990-01-01'), // Default DOB
        gender: 'prefer_not_to_say',
        genderPreference: 'all',
        preferredAgeMin: 18,
        preferredAgeMax: 65,
        proximity: '50km',
        timezone: 'UTC',
        metro_area: 'Unknown',
        latitude: 0,
        longitude: 0,
        profileImage: session.user.image || null,
        about: null,
      })
      .returning()
    
    console.log("✅ User created successfully:", newUser[0])
    
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser[0]
    })
    
  } catch (error) {
    console.error("❌ Fix user error:", error)
    return NextResponse.json({ 
      error: "Failed to fix user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}