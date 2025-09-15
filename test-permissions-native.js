// Test script to verify permissions are working on native platforms
// Run this after building and syncing the app to native platforms

const { execSync } = require('child_process');

console.log('🔧 Testing Native Permissions Setup...\n');

try {
  console.log('1. Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n2. Syncing to native platforms...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  console.log('\n✅ Build and sync completed successfully!');
  console.log('\n📱 Next steps:');
  console.log('1. Run the app on a device: npm run android:dev or npm run ios:dev');
  console.log('2. The app should now request permissions on first launch');
  console.log('3. Check Settings > Apps > MirroSocial > Permissions');
  console.log('4. You should see Camera, Microphone, and Storage permissions available');
  console.log('\n🧪 To test permissions manually, visit: /permissions-test');
  
} catch (error) {
  console.error('❌ Error during build/sync:', error.message);
  process.exit(1);
}