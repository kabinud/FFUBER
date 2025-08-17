// Family Rideshare App Frontend
class FamilyRideshareApp {
  constructor() {
    this.currentUser = null
    this.authToken = null
    this.currentLocation = null
    this.watchId = null
    this.init()
  }

  init() {
    console.log('App initializing...')
    
    // Check for existing session
    this.authToken = localStorage.getItem('authToken')
    console.log('Found token:', this.authToken ? 'Yes' : 'No')
    
    if (this.authToken) {
      console.log('Loading user profile...')
      this.loadUserProfile()
    } else {
      console.log('No token found, showing landing page')
    }

    this.setupEventListeners()
    this.startLocationTracking()
  }

  setupEventListeners() {
    console.log('Setting up event listeners...')
    
    // Navigation buttons
    const loginBtn = document.getElementById('login-btn')
    const registerBtn = document.getElementById('register-btn')
    const getStartedBtn = document.getElementById('get-started-btn')
    
    console.log('Found elements:', { loginBtn, registerBtn, getStartedBtn })
    
    loginBtn?.addEventListener('click', () => {
      console.log('Login button clicked')
      this.showLoginModal()
    })
    registerBtn?.addEventListener('click', () => {
      console.log('Register button clicked')
      this.showRegisterModal()
    })
    getStartedBtn?.addEventListener('click', () => {
      console.log('Get started button clicked')
      this.showRegisterModal()
    })

    // Modal handlers
    document.getElementById('cancel-login')?.addEventListener('click', () => this.hideLoginModal())
    document.getElementById('cancel-register')?.addEventListener('click', () => this.hideRegisterModal())
    document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e))
    document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e))

    // Close modals when clicking outside
    document.getElementById('login-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'login-modal') this.hideLoginModal()
    })
    document.getElementById('register-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'register-modal') this.hideRegisterModal()
    })
  }

  // Location tracking
  startLocationTracking() {
    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          this.updateLocationOnServer()
        },
        (error) => {
          console.log('Location tracking error:', error)
        },
        { enableHighAccuracy: true, maximumAge: 300000, timeout: 5000 }
      )
    }
  }

  async updateLocationOnServer() {
    if (!this.authToken || !this.currentLocation) return

    try {
      await axios.post('/api/user/location', {
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        is_available: this.currentUser?.is_driver && this.currentUser?.is_available
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
    } catch (error) {
      console.log('Failed to update location:', error)
    }
  }

  // Authentication
  showLoginModal() {
    console.log('showLoginModal called')
    const modal = document.getElementById('login-modal')
    console.log('Login modal element:', modal)
    if (modal) {
      modal.classList.remove('hidden')
    } else {
      console.error('Login modal not found!')
    }
  }

  hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden')
    document.getElementById('login-form').reset()
  }

  showRegisterModal() {
    console.log('showRegisterModal called')
    const modal = document.getElementById('register-modal')
    console.log('Register modal element:', modal)
    if (modal) {
      modal.classList.remove('hidden')
    } else {
      console.error('Register modal not found!')
    }
  }

  hideRegisterModal() {
    document.getElementById('register-modal').classList.add('hidden')
    document.getElementById('register-form').reset()
  }

  async handleLogin(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email')

    try {
      const response = await axios.post('/api/auth/login', { email })
      this.authToken = response.data.token
      this.currentUser = response.data.user
      localStorage.setItem('authToken', this.authToken)
      
      this.hideLoginModal()
      this.showApp()
      this.showNotification('Welcome back!', 'success')
    } catch (error) {
      this.showNotification(error.response?.data?.error || 'Login failed', 'error')
    }
  }

  async handleRegister(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email')
    const name = formData.get('name')
    const phone = formData.get('phone')

    try {
      const response = await axios.post('/api/auth/register', { email, name, phone })
      this.authToken = response.data.token
      this.currentUser = response.data.user
      localStorage.setItem('authToken', this.authToken)
      
      this.hideRegisterModal()
      this.showApp()
      this.showNotification('Welcome to Family Rideshare!', 'success')
    } catch (error) {
      this.showNotification(error.response?.data?.error || 'Registration failed', 'error')
    }
  }

  async loadUserProfile() {
    try {
      console.log('Making profile API call...')
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      console.log('Profile loaded:', response.data.user)
      this.currentUser = response.data.user
      this.showApp()
    } catch (error) {
      console.error('Profile loading failed:', error)
      localStorage.removeItem('authToken')
      this.authToken = null
      this.showNotification('Session expired. Please log in again.', 'error')
    }
  }

  logout() {
    localStorage.removeItem('authToken')
    this.authToken = null
    this.currentUser = null
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId)
    }
    location.reload()
  }

  // UI Management
  showApp() {
    console.log('showApp() called')
    console.log('Current user:', this.currentUser)
    console.log('Auth token:', this.authToken ? 'Present' : 'Missing')
    
    const landingPage = document.getElementById('landing-page')
    const appContent = document.getElementById('app-content')
    
    console.log('Landing page element:', landingPage)
    console.log('App content element:', appContent)
    
    if (landingPage && appContent) {
      landingPage.classList.add('hidden')
      appContent.classList.remove('hidden')
      console.log('Page sections toggled successfully')
      
      this.updateNavigation()
      console.log('Navigation updated')
      
      this.loadDashboard()
      console.log('Dashboard loading initiated')
    } else {
      console.error('Required DOM elements not found!')
    }
  }

  updateNavigation() {
    const navButtons = document.getElementById('nav-buttons')
    navButtons.innerHTML = `
      <span class="mr-4">Welcome, ${this.currentUser.name}</span>
      <button onclick="app.logout()" class="bg-red-500 hover:bg-red-700 px-4 py-2 rounded">
        Logout
      </button>
    `
  }

  async loadDashboard() {
    console.log('loadDashboard called')
    const mainContent = document.getElementById('main-content')
    const sidebar = document.getElementById('sidebar-content')
    
    console.log('DOM elements found:', { mainContent: !!mainContent, sidebar: !!sidebar })

    try {
      console.log('Loading dashboard data...')
      
      // Load user's groups and recent rides
      const [groupsResponse, ridesResponse] = await Promise.all([
        axios.get('/api/groups', { headers: { Authorization: `Bearer ${this.authToken}` } }),
        axios.get('/api/rides', { headers: { Authorization: `Bearer ${this.authToken}` } })
      ])

      console.log('API responses received:', { 
        groups: groupsResponse.data, 
        rides: ridesResponse.data 
      })

      const groups = groupsResponse.data.groups || []
      const rides = ridesResponse.data.rides?.slice(0, 5) || [] // Recent 5 rides
      
      console.log('Processed data:', { groups, rides, user: this.currentUser })
      
      // Debug: Log user ID and ride requester IDs
      console.log('Current user ID:', this.currentUser?.id)
      console.log('Current user object:', this.currentUser)
      rides.forEach(ride => {
        console.log(`Ride ${ride.id}: requester_id=${ride.requester_id}, status=${ride.status}`)
        console.log(`  - can_edit=${ride.requester_id == this.currentUser?.id && ride.status === 'requested'}`)
        console.log(`  - can_cancel=${ride.requester_id == this.currentUser?.id && ['requested', 'accepted'].includes(ride.status)}`)
        console.log(`  - requester_id type: ${typeof ride.requester_id}, user_id type: ${typeof this.currentUser?.id}`)
      })

      console.log('Rendering dashboard HTML...')
      
      // Add debug section at the top
      const debugInfo = `
        <div class="bg-yellow-100 border border-yellow-400 rounded p-3 mb-4">
          <h4 class="font-bold text-sm">Debug Info:</h4>
          <p class="text-xs">Current User ID: ${this.currentUser?.id} (${typeof this.currentUser?.id})</p>
          <p class="text-xs">Total Rides: ${rides.length}</p>
          ${rides.map(ride => `
            <p class="text-xs">Ride ${ride.id}: requester=${ride.requester_id} (${typeof ride.requester_id}), status=${ride.status}, is_mine=${ride.requester_id == this.currentUser?.id}</p>
          `).join('')}
        </div>
      `
      
      mainContent.innerHTML = debugInfo + `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Dashboard</h2>
            <button onclick="showRequestRideModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-car mr-2"></i>Request Ride
            </button>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="text-lg font-semibold mb-3">Driver Status</h3>
              <div class="flex items-center gap-4">
                <label class="flex items-center">
                  <input type="checkbox" ${this.currentUser && this.currentUser.is_driver ? 'checked' : ''} 
                         onchange="app.toggleDriverStatus()" class="mr-2">
                  I can drive others
                </label>
                ${this.currentUser && this.currentUser.is_driver ? `
                  <label class="flex items-center">
                    <input type="checkbox" ${this.currentUser.is_available ? 'checked' : ''} 
                           onchange="app.toggleAvailability()" class="mr-2">
                    Available now
                  </label>
                ` : ''}
              </div>
            </div>
            
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
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3">Current Rides</h3>
            <div class="space-y-2">
              ${this.getCurrentRides(rides).length > 0 ? this.getCurrentRides(rides).map(ride => `
                <div class="border-l-4 ${this.getRideStatusColor(ride.status)} pl-4 py-2">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-medium">${ride.pickup_address || 'Pickup location'}</span>
                      <i class="fas fa-arrow-right mx-2 text-gray-400"></i>
                      <span>${ride.destination_address || 'Destination'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm px-2 py-1 rounded ${this.getRideStatusBadge(ride.status)}">
                        ${ride.status.replace('_', ' ')}
                      </span>
                      ${ride.requester_id == this.currentUser?.id && ride.status === 'requested' ? 
                        `<button onclick="app.editRide(${ride.id})" 
                                class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-1">
                          <i class="fas fa-edit mr-1"></i>Edit
                         </button>` : ''}
                      ${ride.requester_id == this.currentUser?.id && ['requested', 'accepted'].includes(ride.status) ? 
                        `<button onclick="app.cancelRide(${ride.id})" 
                                class="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">
                          <i class="fas fa-times mr-1"></i>Cancel
                         </button>` : ''}
                    </div>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    ${ride.group_name} • ${this.formatRideDate(ride.requested_at)}
                    ${ride.requester_name && ride.requester_name !== this.currentUser?.name ? ` • Requested by: ${ride.requester_name}` : ''}
                    ${ride.driver_name ? ` • Driver: ${ride.driver_name}` : ''}
                  </div>
                </div>
              `).join('') : '<p class="text-gray-500 text-center py-4">No current rides.</p>'}
            </div>
          </div>
          
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3">Ride History</h3>
            <div class="space-y-2">
              ${this.getHistoricalRides(rides).length > 0 ? this.getHistoricalRides(rides).map(ride => `
                <div class="border-l-4 ${this.getRideStatusColor(ride.status)} pl-4 py-2">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-medium">${ride.pickup_address || 'Pickup location'}</span>
                      <i class="fas fa-arrow-right mx-2 text-gray-400"></i>
                      <span>${ride.destination_address || 'Destination'}</span>
                    </div>
                    <span class="text-sm px-2 py-1 rounded ${this.getRideStatusBadge(ride.status)}">
                      ${ride.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    ${ride.group_name} • ${this.formatRideDate(ride.requested_at)}
                    ${ride.requester_name && ride.requester_name !== this.currentUser?.name ? ` • Requested by: ${ride.requester_name}` : ''}
                    ${ride.driver_name ? ` • Driver: ${ride.driver_name}` : ''}
                  </div>
                </div>
              `).join('') : '<p class="text-gray-500 text-center py-4">No ride history yet. Request your first ride!</p>'}
            </div>
          </div>
        </div>
      `

      console.log('Rendering sidebar HTML...')
      
      sidebar.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Your Groups</h3>
        <div class="space-y-3">
          ${groups.map(group => `
            <div class="border rounded-lg p-3 hover:bg-gray-50">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h4 class="font-medium">${group.name}</h4>
                  <p class="text-sm text-gray-600">${group.member_count} members</p>
                </div>
                ${group.is_admin ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>' : ''}
              </div>
              ${group.description ? `<p class="text-sm text-gray-500 mb-2">${group.description}</p>` : ''}
              
              <div class="flex gap-2 mt-2">
                <button onclick="viewGroup(${group.id})" class="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                  <i class="fas fa-users mr-1"></i>View Members
                </button>
                ${group.is_admin ? `
                  <button onclick="showInviteCode('${group.invite_code}', '${group.name}')" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    <i class="fas fa-share-alt mr-1"></i>Invite Code
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        ${groups.length === 0 ? `
          <p class="text-gray-500 text-center py-4">No groups yet.</p>
          <button onclick="showCreateGroupModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
            Create First Group
          </button>
        ` : ''}
      `
      
      console.log('Dashboard rendering completed successfully')
    } catch (error) {
      console.error('Dashboard loading error:', error)
      
      // If authentication failed, logout and reload
      if (error.response?.status === 401) {
        this.logout()
        return
      }
      
      // Otherwise show error message in dashboard
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Dashboard Loading Error</h2>
            <p class="text-gray-600 mb-4">There was an issue loading your dashboard. Please try refreshing the page.</p>
            <p class="text-sm text-gray-500 mb-4">Error: ${error.message}</p>
            <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Refresh Page
            </button>
          </div>
        </div>
      `
      
      sidebar.innerHTML = `
        <div class="text-center p-4">
          <p class="text-gray-500">Unable to load groups</p>
          <button onclick="app.loadDashboard()" class="mt-2 text-blue-600 hover:underline text-sm">
            Try Again
          </button>
        </div>
      `
    }
  }

  getRideStatusColor(status) {
    const colors = {
      'requested': 'border-yellow-400',
      'accepted': 'border-blue-400',
      'picked_up': 'border-purple-400',
      'completed': 'border-green-400',
      'cancelled': 'border-red-400'
    }
    return colors[status] || 'border-gray-400'
  }

  getRideStatusBadge(status) {
    const badges = {
      'requested': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'picked_up': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  formatRideDate(dateString) {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours}h ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays}d ago`
      
      // For older dates, show the actual date
      return date.toLocaleDateString()
    } catch (error) {
      // Fallback to simple date formatting
      return new Date(dateString).toLocaleString()
    }
  }

  getCurrentRides(rides) {
    // Current rides: requested, accepted, picked_up
    return rides.filter(ride => ['requested', 'accepted', 'picked_up'].includes(ride.status))
  }

  getHistoricalRides(rides) {
    // Historical rides: completed, cancelled
    return rides.filter(ride => ['completed', 'cancelled'].includes(ride.status))
  }

  async toggleDriverStatus() {
    const isDriver = event.target.checked
    try {
      await axios.put('/api/user/profile', {
        name: this.currentUser.name,
        phone: this.currentUser.phone,
        is_driver: isDriver
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      this.currentUser.is_driver = isDriver
      this.loadDashboard()
      this.showNotification(`Driver status ${isDriver ? 'enabled' : 'disabled'}`, 'success')
    } catch (error) {
      event.target.checked = !isDriver
      this.showNotification('Failed to update driver status', 'error')
    }
  }

  async toggleAvailability() {
    // This will be handled by location updates
    this.currentUser.is_available = event.target.checked
    this.updateLocationOnServer()
  }

  async cancelRide(rideId) {
    if (!confirm('Are you sure you want to cancel this ride request?')) {
      return
    }

    try {
      await axios.put(`/api/rides/${rideId}/status`, {
        status: 'cancelled'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      this.showNotification('Ride request cancelled successfully', 'success')
      this.loadDashboard() // Reload dashboard to update ride list
    } catch (error) {
      console.error('Failed to cancel ride:', error)
      this.showNotification(
        error.response?.data?.error || 'Failed to cancel ride request', 
        'error'
      )
    }
  }

  async editRide(rideId) {
    try {
      // Get current ride data
      const ridesResponse = await axios.get('/api/rides', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      const ride = ridesResponse.data.rides.find(r => r.id === rideId)
      
      if (!ride) {
        this.showNotification('Ride not found', 'error')
        return
      }

      if (ride.status !== 'requested') {
        this.showNotification('Can only edit rides that are still pending', 'error')
        return
      }

      // Get user's groups
      const groupsResponse = await axios.get('/api/groups', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      const groups = groupsResponse.data.groups || []

      // Create edit modal
      this.showEditRideModal(ride, groups)
    } catch (error) {
      console.error('Failed to load ride for editing:', error)
      this.showNotification('Failed to load ride data', 'error')
    }
  }

  showEditRideModal(ride, groups) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-2xl font-bold mb-6">Edit Ride Request</h3>
        <form id="edit-ride-form">
          
          <!-- Group Selection (disabled for existing ride) -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Group</label>
            <input type="text" value="${ride.group_name}" disabled 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
            <input type="hidden" name="group_id" value="${ride.group_id}">
          </div>
          
          <!-- Pickup Location -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Pickup Location</label>
            <div class="relative">
              <input type="text" name="pickup_address" required placeholder="Enter pickup address..." 
                     value="${ride.pickup_address || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" 
                     oninput="handleAddressAutocomplete(this, 'edit_pickup')"
                     onchange="geocodeAddressForEdit(this, 'pickup')"
                     autocomplete="off" />
              <div id="edit_pickup_suggestions" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 hidden max-h-48 overflow-y-auto"></div>
            </div>
            <input type="hidden" name="pickup_latitude" value="${ride.pickup_latitude || ''}" />
            <input type="hidden" name="pickup_longitude" value="${ride.pickup_longitude || ''}" />
            <button type="button" onclick="getCurrentLocationAddressForEdit('pickup')" 
                    class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded">
              <i class="fas fa-location-arrow mr-1"></i>Use Current Location
            </button>
          </div>
          
          <!-- Destination -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Destination</label>
            <div class="relative">
              <input type="text" name="destination_address" required placeholder="Enter destination address..." 
                     value="${ride.destination_address || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                     oninput="handleAddressAutocomplete(this, 'edit_destination')"
                     onchange="geocodeAddressForEdit(this, 'destination')"
                     autocomplete="off" />
              <div id="edit_destination_suggestions" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 hidden max-h-48 overflow-y-auto"></div>
            </div>
            <input type="hidden" name="destination_latitude" value="${ride.destination_latitude || ''}" />
            <input type="hidden" name="destination_longitude" value="${ride.destination_longitude || ''}" />
          </div>
          
          <!-- Passenger Count -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Number of Passengers</label>
            <select name="passenger_count" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="1" ${ride.passenger_count == 1 ? 'selected' : ''}>1 person</option>
              <option value="2" ${ride.passenger_count == 2 ? 'selected' : ''}>2 people</option>
              <option value="3" ${ride.passenger_count == 3 ? 'selected' : ''}>3 people</option>
              <option value="4" ${ride.passenger_count == 4 ? 'selected' : ''}>4 people</option>
              <option value="5" ${ride.passenger_count == 5 ? 'selected' : ''}>5+ people</option>
            </select>
          </div>
          
          <!-- Notes -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Special Notes (optional)</label>
            <textarea name="notes" rows="3" placeholder="Any special instructions..." 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md">${ride.notes || ''}</textarea>
          </div>
          
          <!-- Action buttons -->
          <div class="flex gap-3">
            <button type="button" onclick="this.closest('.fixed').remove()" 
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" 
                    class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
              Update Ride Request
            </button>
          </div>
        </form>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Handle form submission
    document.getElementById('edit-ride-form').addEventListener('submit', (e) => {
      this.handleEditRideSubmit(e, ride.id, modal)
    })
  }

  async handleEditRideSubmit(event, rideId, modal) {
    event.preventDefault()
    const formData = new FormData(event.target)
    
    // Get coordinates (try to geocode if missing)
    let pickupLat = formData.get('pickup_latitude')
    let pickupLng = formData.get('pickup_longitude') 
    let destLat = formData.get('destination_latitude')
    let destLng = formData.get('destination_longitude')
    
    const pickupAddress = formData.get('pickup_address')
    const destinationAddress = formData.get('destination_address')
    
    try {
      // Geocode addresses if coordinates are missing
      if (!pickupLat || !pickupLng) {
        const pickupCoords = await forwardGeocode(pickupAddress)
        pickupLat = pickupCoords.lat
        pickupLng = pickupCoords.lng
      }
      
      if (!destLat || !destLng) {
        const destCoords = await forwardGeocode(destinationAddress)
        destLat = destCoords.lat
        destLng = destCoords.lng
      }
      
      // Submit the updated ride request
      await axios.put(`/api/rides/${rideId}`, {
        pickup_latitude: pickupLat,
        pickup_longitude: pickupLng,
        pickup_address: pickupAddress,
        destination_latitude: destLat,
        destination_longitude: destLng,
        destination_address: destinationAddress,
        passenger_count: parseInt(formData.get('passenger_count')),
        notes: formData.get('notes')
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      
      modal.remove()
      this.showNotification('Ride request updated successfully!', 'success')
      this.loadDashboard() // Reload to show updated ride
      
    } catch (error) {
      console.error('Failed to update ride:', error)
      this.showNotification(
        error.response?.data?.error || 'Failed to update ride request',
        'error'
      )
    }
  }



  // Notification system
  showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 5000)
  }
}

// Initialize app when page loads
let app
document.addEventListener('DOMContentLoaded', () => {
  app = new FamilyRideshareApp()
  // Make app globally available
  window.app = app
  console.log('App instance created and made globally available')
})