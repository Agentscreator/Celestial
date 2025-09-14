// Check user data mismatch and fix it
const fixUserDataMismatch = async () => {
  console.log('🔍 Checking user data mismatch...')
  
  try {
    // Get current session
    const authResponse = await fetch('/api/auth/session')
    const session = await authResponse.json()
    
    console.log('Session user ID:', session?.user?.id)
    console.log('Session user email:', session?.user?.email)
    
    // Check if this user exists in database
    const userResponse = await fetch(`/api/users/profile`)
    
    if (userResponse.ok) {
      const userData = await userResponse.json()
      console.log('✅ User exists in database:', userData.user)
    } else {
      const errorText = await userResponse.text()
      console.error('❌ User NOT found in database:', errorText)
      console.error('🚨 This is the problem! Your session user ID doesn\'t exist in the users table.')
      
      // Suggest solutions
      console.log('\n🔧 SOLUTIONS:')
      console.log('1. Log out and log back in')
      console.log('2. Clear browser cookies/localStorage')
      console.log('3. Check if user was deleted from database')
    }
    
  } catch (error) {
    console.error('❌ Error checking user data:', error)
  }
}

fixUserDataMismatch()