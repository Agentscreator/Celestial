# Event Video Upload Testing Guide

## Overview
This guide tests the new video upload functionality for events, allowing participants to upload and share videos within events.

## Features Implemented

### 1. Database Schema
- ✅ New `event_videos` table with video metadata
- ✅ Foreign key relationships to events and users
- ✅ Support for public/private videos
- ✅ Video metadata fields (duration, file size, etc.)

### 2. API Endpoints
- ✅ `GET /api/events/[eventId]/videos` - List event videos
- ✅ `POST /api/events/[eventId]/videos` - Upload new video
- ✅ `GET /api/events/[eventId]/videos/[videoId]` - Get video details
- ✅ `PATCH /api/events/[eventId]/videos/[videoId]` - Update video metadata
- ✅ `DELETE /api/events/[eventId]/videos/[videoId]` - Delete video

### 3. UI Components
- ✅ `EventVideoUpload` - Multi-method video upload dialog
- ✅ `EventVideos` - Video gallery and management
- ✅ Individual event detail page at `/events/[eventId]`
- ✅ "View Details" button for joined events

### 4. Video Upload Methods
- ✅ File upload from device
- ✅ Camera recording with native permissions
- ✅ Video URL input
- ✅ Video preview and metadata editing

## Testing Steps

### Step 1: Setup
1. Start the development server: `npm run dev`
2. Navigate to `/events` page
3. Create a new test event or join an existing one

### Step 2: Access Event Details
1. After joining an event, click "View Details" button
2. Should navigate to `/events/[eventId]` page
3. Verify event information displays correctly
4. Check that "Videos" tab is available

### Step 3: Test Video Upload - File Method
1. Click "Upload Video" button
2. Select "File" upload method
3. Choose a video file from your device
4. Add title and description
5. Set privacy (public/private)
6. Click "Upload Video"
7. Verify video appears in the gallery

### Step 4: Test Video Upload - Camera Recording
1. Click "Upload Video" button
2. Select "Record" method
3. Grant camera/microphone permissions when prompted
4. Record a short video (5-10 seconds)
5. Stop recording and preview
6. Add metadata and upload
7. Verify recorded video appears in gallery

### Step 5: Test Video Upload - URL Method
1. Click "Upload Video" button
2. Select "URL" method
3. Enter a valid video URL (e.g., from a cloud storage service)
4. Add title and description
5. Upload and verify it appears

### Step 6: Test Video Management
1. Click on a video thumbnail to play it
2. Use the video player dialog
3. For videos you uploaded, test the edit function:
   - Change title/description
   - Toggle public/private
   - Save changes
4. Test video deletion (with confirmation)

### Step 7: Test Permissions
1. Create a test event with another user account
2. Join the event with your main account
3. Verify you can upload videos
4. Verify you can only edit/delete your own videos
5. Test private video visibility (only uploader and event creator see them)

## API Testing (Optional)

### Using curl or Postman:

```bash
# Get event videos
curl -X GET "http://localhost:3000/api/events/1/videos" \
  -H "Cookie: your-session-cookie"

# Upload video metadata
curl -X POST "http://localhost:3000/api/events/1/videos" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "title": "Test Video",
    "description": "A test video upload",
    "duration": 60,
    "fileSize": 1024000,
    "mimeType": "video/mp4",
    "isPublic": true
  }'
```

## Expected Behavior

### Success Cases
- Videos upload successfully and appear in the gallery
- Video metadata is saved correctly
- Privacy settings work as expected
- Video player functions properly
- Edit/delete operations work for authorized users

### Error Cases
- Non-participants cannot upload videos (403 error)
- Invalid video URLs are rejected
- Large file uploads are handled gracefully
- Camera permission denials are handled gracefully

## Troubleshooting

### Common Issues
1. **Camera permissions not working**: Check native permissions implementation
2. **Video upload fails**: Verify API endpoints and database connections
3. **Videos don't appear**: Check event participation status
4. **Navigation issues**: Verify route configuration

### Debug Tips
1. Check browser console for JavaScript errors
2. Check network tab for API request/response details
3. Verify database schema with the migration
4. Test with different video formats and sizes

## Production Considerations

### Before Deploying
1. Implement actual video file upload to cloud storage (currently mocked)
2. Add video thumbnail generation
3. Implement video compression/optimization
4. Add file size and duration limits
5. Add video format validation
6. Configure proper CORS for video URLs
7. Add rate limiting for uploads
8. Implement video moderation if needed

### Security Notes
- Videos are scoped to event participants only
- Private videos are only visible to uploader and event creator
- File upload validation should be enhanced for production
- Consider malware scanning for uploaded files

## Documentation

### For Developers
- Video upload uses existing camera permissions system
- Database schema follows existing patterns
- UI components use the app's design system
- API follows RESTful conventions

### For Users
- Only event participants can upload videos
- Videos can be made public (all participants) or private (uploader only)
- Supported formats: MP4, WebM, and most common video formats
- Videos can be uploaded via file, camera recording, or URL