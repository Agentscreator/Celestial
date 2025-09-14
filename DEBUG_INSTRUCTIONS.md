# Debug Instructions for Post Creation Internal Server Error

## Current Status
The internal server error is still occurring when creating posts. I've created several debugging tools to help identify the exact cause.

## Step-by-Step Debugging

### Step 1: Run Comprehensive Debug
Open your browser console and run this script:
```javascript
// Copy and paste this entire script into your browser console
const comprehensiveDebug = async () => {
  console.log('🔍 COMPREHENSIVE DEBUG - Finding the exact issue...')
  
  // Test 1: Authentication
  console.log('\n1️⃣ Testing authentication...')
  try {
    const authResponse = await fetch('/api/auth/session')
    if (authResponse.ok) {
      const session = await authResponse.json()
      console.log('✅ Auth OK:', session?.user?.id ? 'Logged in' : 'Not logged in')
      if (!session?.user?.id) {
        console.log('❌ You need to be logged in to create posts!')
        return
      }
    } else {
      console.error('❌ Auth check failed:', authResponse.status)
      return
    }
  } catch (error) {
    console.error('❌ Auth error:', error)
    return
  }
  
  // Test 2: Database
  console.log('\n2️⃣ Testing database...')
  try {
    const dbResponse = await fetch('/api/test-db')
    if (dbResponse.ok) {
      const dbResult = await dbResponse.json()
      console.log('✅ Database OK:', dbResult)
    } else {
      const dbError = await dbResponse.text()
      console.error('❌ Database failed:', dbError)
    }
  } catch (error) {
    console.error('❌ Database error:', error)
  }
  
  // Test 3: Main posts endpoint
  console.log('\n3️⃣ Testing MAIN posts endpoint...')
  try {
    const formData = new FormData()
    formData.append('content', 'Debug test ' + Date.now())
    formData.append('isInvite', 'false')
    
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Status:', response.status)
    const responseText = await response.text()
    
    if (response.ok) {
      console.log('✅ SUCCESS! Posts endpoint works!')
      try {
        const result = JSON.parse(responseText)
        console.log('Result:', result)
      } catch (e) {
        console.log('Response:', responseText)
      }
    } else {
      console.error('❌ POSTS ENDPOINT FAILED!')
      console.error('Response:', responseText)
      
      // Check if it's HTML error page
      if (responseText.includes('<html>')) {
        console.error('🚨 HTML ERROR PAGE - Server-side error in API route')
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i)
        if (titleMatch) console.error('Error:', titleMatch[1])
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

comprehensiveDebug()
```

### Step 2: Check Server Logs
If you're running in development mode, check your terminal/console where you started the Next.js server. Look for any error messages that appear when you try to create a post.

### Step 3: Check Network Tab
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to create a post
4. Look at the `/api/posts` request
5. Check the response details

## Possible Issues & Solutions

### Issue 1: TypeScript Compilation Errors
**Symptoms:** API route doesn't load or returns 500 immediately
**Solution:** 
```bash
npx tsc --noEmit --skipLibCheck
```
Fix any TypeScript errors in the posts API route.

### Issue 2: Database Connection Issues
**Symptoms:** Database test fails
**Solution:** Check environment variables and database connection.

### Issue 3: Runtime Errors in API Route
**Symptoms:** HTML error page returned instead of JSON
**Solution:** Check server logs for the specific error.

### Issue 4: Authentication Issues
**Symptoms:** Auth test fails
**Solution:** Make sure you're logged in to the app.

## Quick Fixes to Try

### Fix 1: Restart Next.js Server
Sometimes TypeScript changes require a restart:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Fix 2: Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Fix 3: Check Environment Variables
Make sure all required environment variables are set in `.env.local`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Report Back
After running the comprehensive debug script, please share:
1. The console output
2. Any server-side error messages
3. The Network tab details for the failed request

This will help me identify the exact cause and provide a targeted fix.