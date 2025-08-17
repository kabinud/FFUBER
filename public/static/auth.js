// Simple authentication handlers
async function handleLoginSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const email = formData.get('email')
  
  console.log('Login attempt for:', email)
  
  try {
    const response = await axios.post('/api/auth/login', { email })
    console.log('Login API response:', response.data)
    
    // Store token and user data
    localStorage.setItem('authToken', response.data.token)
    console.log('Token stored in localStorage')
    
    // Close modal
    document.getElementById('login-modal').classList.add('hidden')
    document.getElementById('login-form').reset()
    
    // Check if app instance exists
    console.log('App instance available:', !!window.app)
    
    if (window.app) {
      console.log('Setting app properties...')
      window.app.authToken = response.data.token
      window.app.currentUser = response.data.user
      console.log('App user set to:', window.app.currentUser)
      
      console.log('Calling showApp()...')
      window.app.showApp()
      console.log('showApp() called successfully')
    } else {
      // Fallback: reload page
      console.log('App instance not found - reloading page')
      location.reload()
    }
  } catch (error) {
    console.error('Login error:', error)
    console.error('Error response:', error.response?.data)
    alert('Login failed: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

async function handleRegisterSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const email = formData.get('email')
  const name = formData.get('name')
  const phone = formData.get('phone')
  
  try {
    const response = await axios.post('/api/auth/register', { email, name, phone })
    
    // Store token and user data
    localStorage.setItem('authToken', response.data.token)
    
    // Close modal
    document.getElementById('register-modal').classList.add('hidden')
    document.getElementById('register-form').reset()
    
    // If app instance exists, use it directly
    if (window.app) {
      window.app.authToken = response.data.token
      window.app.currentUser = response.data.user
      window.app.showApp()
      console.log('Registration successful - showing app directly')
    } else {
      // Fallback: reload page
      console.log('App instance not found - reloading page')
      location.reload()
    }
  } catch (error) {
    alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

// Test function to verify script is loading
console.log('Auth.js loaded successfully')