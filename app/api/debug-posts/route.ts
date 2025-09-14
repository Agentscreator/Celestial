import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable } from "@/src/db/schema"

// Simplified POST endpoint for debugging
export async function POST(request: NextRequest) {
    console.log("🐛 DEBUG POSTS API - Starting...")

    try {
        // 1. Check session
        console.log("1️⃣ Checking session...")
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            console.error("❌ No session")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        console.log("✅ Session OK:", session.user.id)

        // 2. Parse form data
        console.log("2️⃣ Parsing form data...")
        let formData: FormData
        try {
            formData = await request.formData()
            console.log("✅ Form data parsed")
        } catch (error) {
            console.error("❌ Form data parsing failed:", error)
            return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
        }

        const content = formData.get("content") as string
        console.log("Content:", content?.substring(0, 50))

        if (!content?.trim()) {
            console.error("❌ No content provided")
            return NextResponse.json({ error: "Content is required" }, { status: 400 })
        }

        // 3. Test database connection
        console.log("3️⃣ Testing database...")
        try {
            // Simple insert
            const result = await db
                .insert(postsTable)
                .values({
                    userId: session.user.id,
                    content: content.trim(),
                    hasPrivateLocation: 0,
                })
                .returning()

            console.log("✅ Database insert successful:", result[0]?.id)

            return NextResponse.json({
                success: true,
                post: result[0],
                message: "Debug post created successfully"
            })

        } catch (dbError) {
            console.error("❌ Database error:", dbError)
            return NextResponse.json({
                error: "Database error",
                details: dbError instanceof Error ? dbError.message : String(dbError)
            }, { status: 500 })
        }

    } catch (error) {
        console.error("❌ Unexpected error:", error)
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}