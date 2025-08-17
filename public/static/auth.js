// Simple authentication handlers
async function handleLoginSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const email = formData.get('email')
  
  try {
    const response = await axios.post('/api/auth/login', { email })
    
    // Store token and user data
    localStorage.setItem('authToken', response.data.token)
    
    // Close modal
    document.getElementById('login-modal').classList.add('hidden')
    document.getElementById('login-form').reset()
    
    // If app instance exists, use it directly
    if (window.app) {
      window.app.authToken = response.data.token
      window.app.currentUser = response.data.user
      window.app.showApp()
      console.log('Login successful - showing app directly')
    } else {
      // Fallback: reload page
      console.log('App instance not found - reloading page')
      location.reload()
    }
  } catch (error) {
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