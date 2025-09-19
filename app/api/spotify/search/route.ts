import { NextRequest, NextResponse } from 'next/server'
import { getSpotifyAccessToken, searchSpotifyTracks, getPopularTracks } from '@/utils/spotify'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const popular = searchParams.get('popular') === 'true'

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Spotify service unavailable' },
        { status: 503 }
      )
    }

    let tracks
    if (popular || !query) {
      // Get popular/trending tracks
      tracks = await getPopularTracks(accessToken)
    } else {
      // Search for specific tracks
      tracks = await searchSpotifyTracks(query, accessToken)
    }

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('Spotify search error:', error)
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    )
  }
}