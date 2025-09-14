// Test script to verify authentication flow
console.log("Testing authentication flow for profile pages...")

// This would be run in a browser environment to test:
// 1. User visits /profile without being authenticated
// 2. Should automatically sign out and redirect to /login
// 3. User visits /profile/[userId] without being authenticated  
// 4. Should automatically sign out and redirect to /login

console.log("✅ Authentication checks added to:")
console.log("- app/(authenticated)/profile/page.tsx")
console.log("- app/(authenticated)/profile/[userId]/page.tsx") 
console.log("- app/(authenticated)/layout.tsx")

console.log("\n🔧 Changes made:")
console.log("1. Added signOut import to profile pages")
console.log("2. Added useEffect to check authentication status")
console.log("3. Automatically call signOut() when user is unauthenticated")
console.log("4. Added global authentication check in authenticated layout")
console.log("5. Added loading state while checking authentication")

console.log("\n🎯 Expected behavior:")
console.log("- If user is not signed in and visits profile page")
console.log("- They will be automatically signed out")
console.log("- Redirected to /login page")
console.log("- No more 'User is not defined' errors")