import { NextRequest, NextResponse } from "next/server"
import { db } from "@/src/db"
import { usersTable, postsTable } from "@/src/db/schema"
import { count } from "drizzle-orm"

// Test database connection
export async function GET(request: NextRequest) {
  try {
    console.log("🗄️ DATABASE TEST - Starting...")
    
    // Test 1: Basic connection
    console.log("Testing basic database connection...")
    const userCount = await db.select({ count: count() }).from(usersTable)
    console.log("✅ Users table accessible, count:", userCount[0]?.count || 0)
    
    // Test 2: Posts table
    console.log("Testing posts table...")
    const postCount = await db.select({ count: count() }).from(postsTable)
    console.log("✅ Posts table accessible, count:", postCount[0]?.count || 0)
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount: userCount[0]?.count || 0,
      postCount: postCount[0]?.count || 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ DATABASE TEST ERROR:", error)
    return NextResponse.json({ 
      error: "Database test failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}