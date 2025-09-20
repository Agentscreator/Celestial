import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')

    if (!input) {
      return NextResponse.json({ error: "Input parameter is required" }, { status: 400 })
    }

    // For now, we'll use a simple geocoding service as a fallback
    // In production, you should add your Google Places API key to environment variables
    // and use: https://maps.googleapis.com/maps/api/place/autocomplete/json
    
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
    
    if (GOOGLE_PLACES_API_KEY) {
      // Use Google Places API if available
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&types=establishment|geocode`
      )
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    }

    // Fallback to Mapbox geocoding (free tier available)
    const fallbackResponse = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw&types=place,locality,neighborhood,address&limit=5`
    )
    
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json()
      
      // Convert Mapbox format to Google Places format
      const predictions = fallbackData.features?.map((feature: any) => ({
        place_id: feature.id,
        description: feature.place_name,
        structured_formatting: {
          main_text: feature.text,
          secondary_text: feature.place_name.replace(feature.text + ', ', '')
        }
      })) || []
      
      return NextResponse.json({ predictions })
    }

    return NextResponse.json({ predictions: [] })
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}