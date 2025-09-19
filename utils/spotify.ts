// Spotify Web API integration for sound selection

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  preview_url: string | null
  duration_ms: number
  external_urls: {
    spotify: string
  }
  album: {
    name: string
    images: { url: string; height: number; width: number }[]
  }
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[]
    total: number
  }
}

// Get Spotify access token using client credentials flow
export async function getSpotifyAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Spotify credentials not configured')
      return null
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    return null
  }
}

// Search for tracks on Spotify
export async function searchSpotifyTracks(
  query: string, 
  accessToken: string,
  limit: number = 20
): Promise<SpotifyTrack[]> {
  try {
    const searchParams = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market: 'US'
    })

    const response = await fetch(`https://api.spotify.com/v1/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`)
    }

    const data: SpotifySearchResponse = await response.json()
    return data.tracks.items.filter(track => track.preview_url) // Only return tracks with previews
  } catch (error) {
    console.error('Error searching Spotify tracks:', error)
    return []
  }
}

// Get popular/trending tracks
export async function getPopularTracks(accessToken: string): Promise<SpotifyTrack[]> {
  try {
    // Get featured playlists and extract tracks
    const response = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Spotify featured playlists failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.playlists.items.length > 0) {
      const playlistId = data.playlists.items[0].id
      
      // Get tracks from the first featured playlist
      const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json()
        return tracksData.items
          .map((item: any) => item.track)
          .filter((track: SpotifyTrack) => track && track.preview_url)
      }
    }

    // Fallback: search for popular tracks
    return await searchSpotifyTracks('year:2024', accessToken, 20)
  } catch (error) {
    console.error('Error getting popular tracks:', error)
    return []
  }
}

// Format track duration
export function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Get track display name
export function getTrackDisplayName(track: SpotifyTrack): string {
  return `${track.name} - ${track.artists.map(a => a.name).join(', ')}`
}