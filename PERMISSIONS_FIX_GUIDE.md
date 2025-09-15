# Native App Permissions Fix Guide

## Problem
Your MirroSocial app wasn't showing any permissions in device Settings (Android/iOS) because permissions were only declared in the native configuration files but never actually requested at runtime.

## Solution Implemented

### 1. Enhanced Permissions System
- **Created `utils/permissions.ts`**: Centralized permissions management using Capacitor
- **Created `hooks/usePermissions.ts`**: React hook for permission state management
- **Updated existing camera utilities**: Enhanced error handling and permission flow

### 2. Automatic Permission Initialization
- **`PermissionsInitializer`**: Silently requests permissions on first app launch
- **`PermissionsOnboarding`**: User-friendly onboarding dialog explaining why permissions are needed
- **`AppPermissionsProvider`**: Wraps the entire app to handle permissions

### 3. Debug and Testing Tools
- **`/permissions-test` page**: Test and debug permission status
- **`PermissionsDebug` component**: Visual permission status display

## How It Works

### On First App Launch (Native Only):
1. `PermissionsInitializer` runs automatically
2. Requests camera and microphone permissions
3. This makes permissions appear in device Settings
4. Shows user-friendly onboarding dialog explaining permissions

### When Using Camera Features:
1. Your existing `NewPostCreator` component uses `useCameraPermissions` hook
2. Hook checks current permission status
3. Requests permissions if needed
4. Provides clear error messages if denied

## Files Added/Modified

### New Files:
- `utils/permissions.ts` - Core permissions management
- `hooks/usePermissions.ts` - React hook for permissions
- `components/PermissionsDebug.tsx` - Debug component
- `components/PermissionsInitializer.tsx` - Auto-initialization
- `components/PermissionsOnboarding.tsx` - User onboarding
- `components/AppPermissionsProvider.tsx` - App-wide provider
- `app/permissions-test/page.tsx` - Test page

### Modified Files:
- `app/providers.tsx` - Added permissions provider
- `capacitor.config.ts` - Cleaned up configuration

## Testing the Fix

### 1. Build and Sync
```bash
npm run build
npx cap sync
```

### 2. Test on Device
```bash
# Android
npm run android:dev

# iOS  
npm run ios:dev
```

### 3. Verify Permissions
1. Launch the app on a real device
2. App should request permissions on first launch
3. Go to device Settings → Apps → MirroSocial → Permissions
4. You should now see Camera, Microphone, and Storage permissions

### 4. Test Permission Flow
1. Visit `/permissions-test` in the app
2. Use the debug tools to check permission status
3. Test the "Request Permissions" button
4. Try using the camera in the NewPostCreator

## Expected Behavior

### Android:
- Settings → Apps → MirroSocial → Permissions shows:
  - Camera (for video recording)
  - Microphone (for audio recording)  
  - Storage/Files (for saving media)

### iOS:
- Settings → MirroSocial shows:
  - Camera
  - Microphone
  - Photos

## Troubleshooting

### If Permissions Still Don't Appear:
1. Uninstall the app completely
2. Rebuild and reinstall: `npm run android:build` or `npm run ios:build`
3. Launch the app - it should request permissions

### If Permission Requests Fail:
1. Check the `/permissions-test` page for detailed error messages
2. Ensure you're testing on a real device (not simulator)
3. Check device logs for permission-related errors

### If Camera Still Doesn't Work:
1. Manually enable permissions in device Settings
2. Restart the app
3. Test camera functionality in NewPostCreator

## Key Improvements

1. **Proactive Permission Requests**: App now requests permissions on launch
2. **Better User Experience**: Clear onboarding explaining why permissions are needed
3. **Comprehensive Error Handling**: Detailed error messages for different failure scenarios
4. **Debug Tools**: Easy way to test and troubleshoot permission issues
5. **Persistent State**: Remembers permission status and onboarding completion

The app will now properly request and display permissions in device Settings, making all native features work as expected!