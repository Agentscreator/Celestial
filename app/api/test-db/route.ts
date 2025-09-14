import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { eventsTable } from "@/src/db/schema"

export async function GET() {
  try {
    // Test basic database connection
    const result = await db.select().from(eventsTable).limit(1)

    return NextResponse.json({
      status: "Database connection successful",
      tableExists: true,
      recordCount: result.length
    })
  } catch (error) {
    console.error("Database test error:", error)

    return NextResponse.json({
      status: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}