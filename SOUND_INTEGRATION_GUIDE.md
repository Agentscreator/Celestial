# 🎵 Sound Integration Guide

This guide explains how to set up and use the Spotify sound integration for the MirroSocial app.

## 🚀 Setup Instructions

### 1. Spotify App Registration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use an existing one
3. Note down your **Client ID** and **Client Secret**
4. Add your app's domain to the redirect URIs (not required for this integration)

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### 3. Database Migration

The sound fields have been added to the posts table:
- `sound_id` - Spotify track ID
- `sound_name` - Track name
- `sound_artist` - Artist name(s)
- `sound_preview_url` - Spotify preview URL (30-second clip)
- `sound_spotify_url` - Full Spotify track URL

Run the migration:
```bash
npx drizzle-kit push
```

## 🎯 Features

### For Users

1. **Add Sound to Posts**
   - Click the "Sound" button in the camera interface
   - Search for tracks or browse popular sounds
   - Preview tracks before selecting
   - Selected sound appears with a green indicator

2. **Sound Display in Feed**
   - Posts with sounds show a music indicator
   - Displays track name and artist
   - Click Spotify icon to open in Spotify app/web

### For Developers

1. **API Endpoints**
   - `GET /api/spotify/search?q=query` - Search tracks
   - `GET /api/spotify/search?popular=true` - Get popular tracks

2. **Components**
   - `SoundSelector` - Sound selection modal
   - Updated `NewPostCreator` - Integrated sound functionality
   - Updated `VideoFeedItem` - Display sound info in posts

## 🧪 Testing

### Test the Integration

1. Open `test-spotify-integration.html` in your browser
2. Click "Load Popular" to see trending tracks
3. Search for specific songs
4. Test preview playback
5. Verify track selection works

### Test in App

1. Open the app and create a new post
2. Click the "Sound" button (music note icon)
3. Search for a song or browse popular tracks
4. Select a track and create your post
5. Verify the sound appears in the feed

## 🔧 Technical Details

### Spotify Web API Integration

- Uses **Client Credentials Flow** (no user login required)
- Searches public track catalog
- Returns tracks with 30-second previews
- Filters out tracks without preview URLs

### Data Flow

1. User opens sound selector
2. App fetches Spotify access token
3. User searches or browses popular tracks
4. User selects a track
5. Track data is attached to the post
6. Post is created with sound metadata
7. Sound info displays in the feed

### Security

- Spotify credentials are server-side only
- No user authentication required
- Preview URLs are public and temporary
- Full track URLs redirect to Spotify

## 🎨 UI/UX Features

### Sound Selector
- Clean, modern interface
- Real-time search with debouncing
- Audio preview with volume control
- Track artwork and metadata display
- Easy selection and removal

### Post Creator
- Sound button changes color when track selected
- Selected track preview in camera mode
- Sound info persists through recording/upload

### Feed Display
- Elegant sound card with track info
- Spotify branding and link
- Consistent with app design language

## 🐛 Troubleshooting

### Common Issues

1. **"Spotify service unavailable"**
   - Check your Spotify credentials in `.env`
   - Verify credentials are valid
   - Check network connectivity

2. **"No tracks found"**
   - Try different search terms
   - Some tracks may not have previews
   - Check if Spotify API is accessible

3. **Preview won't play**
   - Check browser audio permissions
   - Verify preview URL is valid
   - Try different tracks

### Debug Mode

Set `NODE_ENV=development` to see detailed logs:
- Spotify API requests/responses
- Track selection events
- Audio playback status

## 🚀 Future Enhancements

### Planned Features
- Custom sound uploads
- Sound effects library
- Audio editing tools
- Sound trending analytics
- User-generated sound collections

### Integration Ideas
- Apple Music support
- SoundCloud integration
- TikTok sound library
- Original music creation tools

## 📝 Notes

- Spotify previews are 30 seconds max
- Not all tracks have preview URLs
- Preview URLs expire after some time
- Full playback requires Spotify Premium
- Respect Spotify's terms of service

## 🤝 Contributing

When adding new sound features:
1. Follow existing code patterns
2. Add proper error handling
3. Include user feedback (toasts)
4. Test on mobile devices
5. Update this documentation

---

**Happy coding! 🎵**