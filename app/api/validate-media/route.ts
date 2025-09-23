import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    
    console.log('🔍 Validating media URL:', url)
    
    // Try to fetch the URL to check if it's accessible
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'MirroSocial-MediaValidator/1.0'
        }
      })
      
      const result = {
        url,
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        lastModified: response.headers.get('last-modified'),
        timestamp: new Date().toISOString()
      }
      
      console.log('📊 Validation result:', result)
      
      return NextResponse.json(result)
      
    } catch (fetchError) {
      console.error('❌ URL fetch failed:', fetchError)
      
      const result = {
        url,
        accessible: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      
      return NextResponse.json(result)
    }
    
  } catch (error) {
    console.error('❌ Media validation error:', error)
    return NextResponse.json(
      { error: "Failed to validate media URL" },
      { status: 500 }
    )
  }
}