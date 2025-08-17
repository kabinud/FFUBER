// Simple authentication handlers
async function handleLoginSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const email = formData.get('email')
  
  // Removed debug log('Login attempt for:', email)
  
  try {
    const response = await axios.post('/api/auth/login', { email })
    // Removed debug log('Login API response:', response.data)
    
    // Store token and user data
    localStorage.setItem('authToken', response.data.token)
    // Removed debug log('Token stored in localStorage')
    
    // Close modal
    document.getElementById('login-modal').classList.add('hidden')
    document.getElementById('login-form').reset()
    
    // Check if app instance exists
    // Removed debug log('App instance available:', !!window.app)
    
    // Since test function works, let's use the same approach
    // Removed debug log('Attempting to show dashboard...')
    
    // Hide landing page, show app content
    const landingPage = document.getElementById('landing-page')
    const appContent = document.getElementById('app-content')
    
    if (landingPage && appContent) {
      landingPage.classList.add('hidden')
      appContent.classList.remove('hidden')
      
      
      // Load full dashboard using app instance if available, otherwise use simplified version
      if (window.app) {
        // Set app properties and use full functionality
        window.app.authToken = response.data.token
        window.app.currentUser = response.data.user
        window.app.showApp()
      } else {
        // Simplified dashboard as fallback
        loadSimpleDashboard(response.data.user)
      }
      
      // Removed debug log('Dashboard shown successfully using direct DOM approach')
    } else {
      logger?.error('Required DOM elements not found')
      alert('Error: Could not find page elements')
    }

// Simplified dashboard function as fallback
function loadSimpleDashboard(user) {
  const mainContent = document.getElementById('main-content')
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Dashboard</h2>
        <p class="mb-4">Welcome back, ${user.name}!</p>
        
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="text-lg font-semibold mb-3">Quick Actions</h3>
            <div class="flex gap-2">
              <button onclick="showCreateGroupModal()" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                Create Group
              </button>
              <button onclick="showJoinGroupModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                Join Group
              </button>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-3">Driver Status</h3>
            <label class="flex items-center">
              <input type="checkbox" ${user.is_driver ? 'checked' : ''} onchange="toggleDriverStatus()" class="mr-2">
              I can drive others
            </label>
          </div>
        </div>
        
        <button onclick="showRequestRideModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          <i class="fas fa-car mr-2"></i>Request Ride
        </button>
      </div>
    `
  }
  
  // Load groups for sidebar
  loadGroupsSidebar()
}
  } catch (error) {
    logger?.error('Login error:', error)
    logger?.error('Error response:', error.response?.data)
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
    
    // Use the same approach as login
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
      
      // Load full dashboard using app instance if available
      if (window.app) {
        window.app.authToken = response.data.token
        window.app.currentUser = response.data.user
        window.app.showApp()
      } else {
        loadSimpleDashboard(response.data.user)
      }
      
      // Removed debug log('Registration successful - dashboard shown')
    }
  } catch (error) {
    alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

// Test function to verify script is loading
// Auth.js module loaded