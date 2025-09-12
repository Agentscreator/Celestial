import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { eventThemesTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

// GET - Fetch available event themes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = db
      .select()
      .from(eventThemesTable)
      .where(eq(eventThemesTable.isActive, 1))

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.where(eq(eventThemesTable.category, category))
    }

    const themes = await query.orderBy(eventThemesTable.category, eventThemesTable.name)

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("Themes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}