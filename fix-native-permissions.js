// Script to fix native permissions by ensuring proper build and sync
const { execSync } = require('child_process');

console.log('🔧 Fixing Native Permissions...\n');

try {
  console.log('1. Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n2. Syncing to native platforms...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  console.log('\n3. Copying native files...');
  execSync('npx cap copy', { stdio: 'inherit' });
  
  console.log('\n✅ Build, sync, and copy completed successfully!');
  console.log('\n📱 Next steps to test native permissions:');
  console.log('1. UNINSTALL the existing app from your device completely');
  console.log('2. Run: npm run android:dev (or npm run ios:dev)');
  console.log('3. When the app launches, go to /permissions-test');
  console.log('4. Tap "Force Native Permission Requests"');
  console.log('5. Allow permissions when prompted');
  console.log('6. Check Settings > Apps > MirroSocial > Permissions');
  console.log('\n⚠️  IMPORTANT: You MUST uninstall the old app first!');
  console.log('   Old installations may not trigger permission requests properly.');
  
} catch (error) {
  console.error('❌ Error during build/sync:', error.message);
  process.exit(1);
}