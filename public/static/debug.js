// Debug script to test login flow
window.debugLogin = async function() {
  console.log('=== DEBUG LOGIN START ===')
  
  try {
    console.log('Step 1: Testing login API call...')
    const response = await axios.post('/api/auth/login', {
      email: 'test@example.com'
    })
    console.log('Login API response:', response.data)
    
    console.log('Step 2: Setting up app state...')
    localStorage.setItem('authToken', response.data.token)
    
    if (window.app) {
      console.log('App instance found, setting properties...')
      window.app.authToken = response.data.token
      window.app.currentUser = response.data.user
      console.log('App state set:', { token: !!window.app.authToken, user: !!window.app.currentUser })
    } else {
      console.error('No app instance found!')
    }
    
    console.log('Step 3: Testing DOM elements...')
    const landingPage = document.getElementById('landing-page')
    const appContent = document.getElementById('app-content')
    const mainContent = document.getElementById('main-content')
    const sidebar = document.getElementById('sidebar-content')
    
    console.log('DOM elements:', {
      landingPage: !!landingPage,
      appContent: !!appContent,
      mainContent: !!mainContent,
      sidebar: !!sidebar
    })
    
    console.log('Step 4: Switching to dashboard view...')
    if (landingPage && appContent) {
      landingPage.classList.add('hidden')
      appContent.classList.remove('hidden')
      console.log('View switched to app content')
    }
    
    console.log('Step 5: Testing loadDashboard...')
    if (window.app && window.app.loadDashboard) {
      console.log('Calling app.loadDashboard()...')
      await window.app.loadDashboard()
      console.log('loadDashboard completed')
    } else {
      console.error('loadDashboard method not found!')
    }
    
    console.log('=== DEBUG LOGIN SUCCESS ===')
    return 'Login test completed successfully'
    
  } catch (error) {
    console.error('=== DEBUG LOGIN ERROR ===')
    console.error('Error details:', error)
    console.error('Stack trace:', error.stack)
    return 'Login test failed: ' + error.message
  }
}

console.log('Debug script loaded - use window.debugLogin() to test')

// Auto-run disabled - use window.debugLogin() manually to test
// setTimeout(async () => {
//   console.log('Auto-running debug login test...')
//   await window.debugLogin()
// }, 3000)