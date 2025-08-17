// Simple authentication handlers
async function handleLoginSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const email = formData.get('email')
  
  try {
    const response = await axios.post('/api/auth/login', { email })
    localStorage.setItem('authToken', response.data.token)
    alert('Login successful! Reloading page...')
    location.reload()
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
    localStorage.setItem('authToken', response.data.token)
    alert('Registration successful! Reloading page...')
    location.reload()
  } catch (error) {
    alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

// Test function to verify script is loading
console.log('Auth.js loaded successfully')