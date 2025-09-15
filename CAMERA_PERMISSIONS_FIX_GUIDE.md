# Camera Permissions Fix Guide

## Problem
Camera permissions are not showing up in device settings and native permission dialogs are not appearing on mobile apps.

## Root Cause
The app was using web-based `getUserMedia` API instead of native Capacitor Camera plugin permissions, which meant:
- No native permission dialogs
- No permissions registered in device settings
- Limited functionality on mobile devices

## Solution Applied

### 1. Updated Capacitor Configuration
✅ Added Camera plugin configuration to `capacitor.config.ts`:
```typescript
plugins: {
  Camera: {
    permissions: ['camera', 'photos']
  },
  // ... other plugins
}
```

### 2. Updated Camera Utilities
✅ Modified `utils/camera.ts` to use native Capacitor Camera plugin:
- `requestCameraPermissions()` - Now uses native `Camera.requestPermissions()`
- `checkCameraPermissions()` - Now uses native `Camera.checkPermissions()`
- `takePhoto()` - Now uses native `Camera.getPhoto()` on mobile

### 3. Created Testing Tools
✅ Added permission testing components:
- `components/PermissionTester.tsx` - Interactive permission tester
- `app/test-permissions/page.tsx` - Test page
- `test-native-permissions.js` - Debugging script

## Testing Steps

### Step 1: Build and Deploy
```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync

# Build for Android
npx cap build android

# Build for iOS  
npx cap build ios
```

### Step 2: Test on Physical Device
**Important: Test on a physical device, not simulator/emulator**

1. Install the app on your device
2. Navigate to `/test-permissions` in the app
3. Click "Request" for Camera permissions
4. You should see a native permission dialog
5. Allow the permissions

### Step 3: Verify in Device Settings

#### Android:
1. Go to Settings > Apps > MirroSocial > Permissions
2. You should see Camera and Storage permissions listed
3. Both should be enabled

#### iOS:
1. Go to Settings > Privacy & Security > Camera
2. You should see MirroSocial listed
3. Enable the toggle for MirroSocial
4. Also check Settings > Privacy & Security > Photos

### Step 4: Test Camera Functionality
1. Open the app
2. Try to create a new post with camera
3. The camera should work without additional permission prompts

## Troubleshooting

### If Permissions Still Don't Appear:

1. **Clear App Data** (Android):
   - Settings > Apps > MirroSocial > Storage > Clear Data
   - Reinstall the app

2. **Delete and Reinstall** (iOS):
   - Delete the app completely
   - Reinstall from Xcode/TestFlight

3. **Check Capacitor Version**:
   ```bash
   npx cap doctor
   ```

4. **Verify Plugin Installation**:
   ```bash
   npm list @capacitor/camera
   ```

### Common Issues:

1. **"Permission denied" without dialog**:
   - User previously denied permission
   - Need to manually enable in device settings

2. **Permissions not in settings**:
   - App not properly requesting native permissions
   - Check that you're testing on physical device
   - Verify Capacitor sync completed successfully

3. **Camera plugin not found**:
   - Run `npx cap sync` again
   - Check that `@capacitor/camera` is in package.json

## Verification Checklist

- [ ] Native permission dialog appears when requesting camera access
- [ ] Camera permission visible in device settings (Android: Settings > Apps > MirroSocial > Permissions)
- [ ] Camera permission visible in device settings (iOS: Settings > Privacy > Camera)
- [ ] Photo library permission visible in device settings (iOS: Settings > Privacy > Photos)
- [ ] Camera works in the app without additional prompts after granting permission
- [ ] Permission status persists after app restart

## Next Steps

1. Test the permission flow on both Android and iOS devices
2. If permissions appear in settings, the fix is successful
3. If issues persist, check the troubleshooting section above
4. Consider adding permission status indicators in your main app UI

## Files Modified

- `capacitor.config.ts` - Added Camera plugin configuration
- `utils/camera.ts` - Updated to use native Capacitor Camera APIs
- `components/PermissionTester.tsx` - New testing component
- `app/test-permissions/page.tsx` - New test page
- `test-native-permissions.js` - Debugging utilities

The key change is that your app now properly requests native permissions through the Capacitor Camera plugin, which will register the permissions with the device's permission system and make them visible in device settings.