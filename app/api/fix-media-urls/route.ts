import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable } from "@/src/db/schema"
import { like, or } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    console.log("=== FIX MEDIA URLS API START ===")
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.error("❌ UNAUTHORIZED: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("🔍 Finding posts with broken media URLs...")
    
    // Find all posts with the old media.mirro2.com URLs
    const brokenPosts = await db
      .select()
      .from(postsTable)
      .where(
        or(
          like(postsTable.video, '%media.mirro2.com%'),
          like(postsTable.image, '%media.mirro2.com%')
        )
      )
    
    console.log(`📊 Found ${brokenPosts.length} posts with broken URLs`)
    
    if (brokenPosts.length === 0) {
      return NextResponse.json({
        message: "No broken URLs found",
        fixed: 0,
        posts: []
      })
    }
    
    // Fix the URLs
    const fixedPosts = []
    let totalFixed = 0
    
    for (const post of brokenPosts) {
      const updates: any = {}
      let hasUpdates = false
      
      // Fix video URL
      if (post.video && post.video.includes('media.mirro2.com')) {
        updates.video = post.video.replace(
          'https://media.mirro2.com',
          'https://pub-f50a78c96ae94eb08dea6fb65f69d0e1.r2.dev'
        )
        hasUpdates = true
        console.log(`🎥 Fixing video URL for post ${post.id}:`)
        console.log(`  From: ${post.video}`)
        console.log(`  To: ${updates.video}`)
      }
      
      // Fix image URL
      if (post.image && post.image.includes('media.mirro2.com')) {
        updates.image = post.image.replace(
          'https://media.mirro2.com',
          'https://pub-f50a78c96ae94eb08dea6fb65f69d0e1.r2.dev'
        )
        hasUpdates = true
        console.log(`🖼️ Fixing image URL for post ${post.id}:`)
        console.log(`  From: ${post.image}`)
        console.log(`  To: ${updates.image}`)
      }
      
      // Update the post if there are changes
      if (hasUpdates) {
        try {
          await db
            .update(postsTable)
            .set(updates)
            .where(postsTable.id.eq(post.id))
          
          totalFixed++
          fixedPosts.push({
            id: post.id,
            originalVideo: post.video,
            originalImage: post.image,
            fixedVideo: updates.video || post.video,
            fixedImage: updates.image || post.image
          })
          
          console.log(`✅ Fixed post ${post.id}`)
        } catch (updateError) {
          console.error(`❌ Failed to fix post ${post.id}:`, updateError)
        }
      }
    }
    
    console.log(`✅ Fixed ${totalFixed} posts`)
    console.log("=== FIX MEDIA URLS API END ===")
    
    return NextResponse.json({
      message: `Successfully fixed ${totalFixed} posts`,
      fixed: totalFixed,
      posts: fixedPosts
    })
    
  } catch (error) {
    console.error("❌ FIX MEDIA URLS API ERROR:", error)
    return NextResponse.json(
      { error: "Failed to fix media URLs" },
      { status: 500 }
    )
  }
}