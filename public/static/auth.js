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
    
    // Since test function works, let's use the same approach
    console.log('Attempting to show dashboard...')
    
    // Hide landing page, show app content
    const landingPage = document.getElementById('landing-page')
    const appContent = document.getElementById('app-content')
    
    if (landingPage && appContent) {
      landingPage.classList.add('hidden')
      appContent.classList.remove('hidden')
      
      // Set up navigation for logged-in user
      const navButtons = document.getElementById('nav-buttons')
      if (navButtons && response.data.user) {
        navButtons.innerHTML = `
          <span class="mr-4 text-white">Welcome, ${response.data.user.name}</span>
          <button onclick="localStorage.removeItem('authToken'); location.reload()" class="bg-red-500 hover:bg-red-700 px-4 py-2 rounded">
            Logout
          </button>
        `
      }
      
      // Set up basic dashboard content
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.innerHTML = `
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-bold mb-4">Dashboard</h2>
            <p class="mb-4">Welcome back, ${response.data.user.name}!</p>
            
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 class="text-lg font-semibold mb-3">Quick Actions</h3>
                <div class="flex gap-2">
                  <button onclick="alert('Create Group - Feature coming soon!')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                    Create Group
                  </button>
                  <button onclick="alert('Join Group - Feature coming soon!')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                    Join Group
                  </button>
                </div>
              </div>
              
              <div>
                <h3 class="text-lg font-semibold mb-3">Driver Status</h3>
                <label class="flex items-center">
                  <input type="checkbox" class="mr-2">
                  I can drive others
                </label>
              </div>
            </div>
            
            <button onclick="alert('Request Ride - Feature coming soon!')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-car mr-2"></i>Request Ride
            </button>
          </div>
        `
      }
      
      // Set up sidebar
      const sidebar = document.getElementById('sidebar-content')
      if (sidebar) {
        sidebar.innerHTML = `
          <h3 class="text-lg font-semibold mb-4">Your Groups</h3>
          <p class="text-gray-500 text-center py-4">No groups yet.</p>
          <button onclick="alert('Create your first group!')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
            Create First Group
          </button>
        `
      }
      
      console.log('Dashboard shown successfully using direct DOM approach')
    } else {
      console.error('Required DOM elements not found')
      alert('Error: Could not find page elements')
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
    
    // Use the same direct DOM approach that works for login
    const landingPage = document.getElementById('landing-page')
    const appContent = document.getElementById('app-content')
    
    if (landingPage && appContent) {
      landingPage.classList.add('hidden')
      appContent.classList.remove('hidden')
      
      // Set up navigation
      const navButtons = document.getElementById('nav-buttons')
      if (navButtons) {
        navButtons.innerHTML = `
          <span class="mr-4 text-white">Welcome, ${response.data.user.name}</span>
          <button onclick="localStorage.removeItem('authToken'); location.reload()" class="bg-red-500 hover:bg-red-700 px-4 py-2 rounded">
            Logout
          </button>
        `
      }
      
      // Set up dashboard (same as login)
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.innerHTML = `
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-bold mb-4">Welcome to Family Rideshare!</h2>
            <p class="mb-4">Thanks for joining, ${response.data.user.name}! Get started by creating or joining a family group.</p>
            
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 class="text-lg font-semibold mb-3">Quick Actions</h3>
                <div class="flex gap-2">
                  <button onclick="alert('Create Group - Feature coming soon!')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                    Create Group
                  </button>
                  <button onclick="alert('Join Group - Feature coming soon!')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                    Join Group
                  </button>
                </div>
              </div>
              
              <div>
                <h3 class="text-lg font-semibold mb-3">Driver Status</h3>
                <label class="flex items-center">
                  <input type="checkbox" class="mr-2">
                  I can drive others
                </label>
              </div>
            </div>
          </div>
        `
      }
      
      const sidebar = document.getElementById('sidebar-content')
      if (sidebar) {
        sidebar.innerHTML = `
          <h3 class="text-lg font-semibold mb-4">Getting Started</h3>
          <p class="text-sm text-gray-600 mb-4">Welcome! Create your first family group to start sharing rides with people you trust.</p>
          <button onclick="alert('Create your first group!')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
            Create First Group
          </button>
        `
      }
      
      console.log('Registration successful - dashboard shown')
    }
  } catch (error) {
    alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

// Test function to verify script is loading
console.log('Auth.js loaded successfully')