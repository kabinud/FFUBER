// Family Rideshare App Frontend
class FamilyRideshareApp {
  constructor() {
    this.currentUser = null
    this.authToken = null
    this.currentLocation = null
    this.watchId = null
    this.currentView = 'dashboard'
    this.timeoutManager = null // Will be initialized after DOM loads
    this.init()
  }

  init() {
    logger?.info('App initializing')
    
    // Check for existing session
    this.authToken = localStorage.getItem('authToken')
    
    if (this.authToken) {
      this.loadUserProfile()
    }

    this.setupEventListeners()
    this.startLocationTracking()
  }

  setupEventListeners() {
    // Navigation buttons
    const loginBtn = document.getElementById('login-btn')
    const registerBtn = document.getElementById('register-btn')
    const getStartedBtn = document.getElementById('get-started-btn')
    
    loginBtn?.addEventListener('click', () => this.showLoginModal())
    registerBtn?.addEventListener('click', () => this.showRegisterModal())
    getStartedBtn?.addEventListener('click', () => this.showRegisterModal())

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
          logger?.warn('Location tracking error', error.message)
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
      logger?.error('Failed to update location', error)
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
    // Clear all ride timeouts
    this.rideTimeouts.forEach((timeoutData, rideId) => {
      this.clearRideTimeout(rideId)
    })
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
      
      this.showDashboard()
      console.log('Dashboard loading initiated')
    } else {
      console.error('Required DOM elements not found!')
    }
  }

  updateNavigation() {
    const navButtons = document.getElementById('nav-buttons')
    navButtons.innerHTML = `
      <div class="flex items-center space-x-4">
        <button onclick="app.showDashboard()" class="hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium ${this.currentView === 'dashboard' ? 'bg-blue-700' : 'bg-blue-500'}">
          <i class="fas fa-home mr-1"></i>Dashboard
        </button>
        <button onclick="app.showRideHistory()" class="hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium ${this.currentView === 'history' ? 'bg-blue-700' : 'bg-blue-500'}">
          <i class="fas fa-history mr-1"></i>Ride History
        </button>
        <span class="text-white mr-2">Welcome, ${this.currentUser.name}</span>
        <button onclick="app.logout()" class="bg-red-500 hover:bg-red-700 px-4 py-2 rounded">
          Logout
        </button>
      </div>
    `
  }

  showDashboard() {
    this.currentView = 'dashboard'
    this.updateNavigation()
    this.loadDashboard()
  }

  showRideHistory() {
    this.currentView = 'history'
    this.updateNavigation()
    this.loadRideHistory()
  }

  async loadDashboard() {
    console.log('loadDashboard called')
    const mainContent = document.getElementById('main-content')
    const sidebar = document.getElementById('sidebar-content')
    
    console.log('DOM elements found:', { mainContent: !!mainContent, sidebar: !!sidebar })

    try {
      console.log('Loading dashboard data...')
      
      // Load user's groups, recent rides, and available rides for drivers
      const requests = [
        axios.get('/api/groups', { headers: { Authorization: `Bearer ${this.authToken}` } }),
        axios.get('/api/rides', { headers: { Authorization: `Bearer ${this.authToken}` } })
      ]
      
      // Add available rides request if user is a driver
      if (this.currentUser && this.currentUser.is_driver) {
        requests.push(axios.get('/api/rides/available', { headers: { Authorization: `Bearer ${this.authToken}` } }))
      }
      
      const responses = await Promise.all(requests)
      const [groupsResponse, ridesResponse, availableRidesResponse] = responses

      console.log('API responses received:', { 
        groups: groupsResponse.data, 
        rides: ridesResponse.data 
      })

      const groups = groupsResponse.data.groups || []
      const rides = ridesResponse.data.rides || [] // All current rides
      const availableRides = availableRidesResponse?.data.rides || []
      
      console.log('Processed data:', { groups, rides, availableRides, user: this.currentUser })
      
      // Debug logging (can be removed in production)
      console.log('Current user ID:', this.currentUser?.id)
      console.log('Loaded rides:', rides.length)
      
      // Start timeout monitoring for any existing requested rides
      this.monitorExistingRides(rides)

      console.log('Rendering dashboard HTML...')
      
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Dashboard</h2>
            <div class="flex items-center gap-3">
              ${this.currentUser && this.currentUser.is_driver ? `
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">Driver Status:</span>
                  <button onclick="app.toggleDriverAvailability()" 
                          class="px-4 py-2 rounded-lg font-medium transition-all ${this.currentUser.is_available ? 
                            'bg-green-600 hover:bg-green-700 text-white' : 
                            'bg-gray-300 hover:bg-gray-400 text-gray-700'}">
                    <i class="fas ${this.currentUser.is_available ? 'fa-car' : 'fa-car-slash'} mr-2"></i>
                    ${this.currentUser.is_available ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              ` : ''}
              ${this.currentUser && this.currentUser.is_driver && this.currentUser.is_available ? 
                `<span class="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-sm font-medium">
                  <i class="fas fa-info-circle mr-1"></i>
                  You're available as a driver - ride requests disabled
                 </span>` :
                `<button onclick="showRequestRideModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  <i class="fas fa-car mr-2"></i>Request Ride
                 </button>`}
            </div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="text-lg font-semibold mb-3">Profile Settings</h3>
              <div class="flex items-center gap-4">
                <label class="flex items-center">
                  <input type="checkbox" ${this.currentUser && this.currentUser.is_driver ? 'checked' : ''} 
                         onchange="app.toggleDriverStatus()" class="mr-2">
                  I can drive others
                </label>
                ${this.currentUser && this.currentUser.is_driver ? `
                  <span class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i>
                    Use the availability toggle above to start/stop receiving requests
                  </span>
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

          ${!this.currentUser?.is_driver ? `
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
          ` : ''}

          
          ${this.currentUser && this.currentUser.is_driver ? `
            <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h3 class="text-lg font-semibold mb-4">
                <i class="fas fa-car mr-2 text-blue-600"></i>
                Available Ride Requests (Driver View)
              </h3>
              <div class="space-y-3">
                ${availableRides.length > 0 ? availableRides.map(ride => `
                  <div class="border rounded-lg p-4 hover:bg-gray-50">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1">
                        <div class="flex items-center mb-2">
                          <i class="fas fa-user mr-2 text-gray-400"></i>
                          <span class="font-medium">${ride.requester_name}</span>
                          <span class="mx-2 text-gray-400">•</span>
                          <span class="text-sm text-gray-600">${ride.group_name}</span>
                        </div>
                        <div class="flex items-center mb-2">
                          <i class="fas fa-map-marker-alt mr-2 text-green-600"></i>
                          <span class="text-sm">${ride.pickup_address || 'Pickup location'}</span>
                        </div>
                        <div class="flex items-center mb-2">
                          <i class="fas fa-flag-checkered mr-2 text-red-600"></i>
                          <span class="text-sm">${ride.destination_address || 'Destination'}</span>
                        </div>
                        <div class="flex items-center text-xs text-gray-500 space-x-4">
                          <span><i class="fas fa-users mr-1"></i>${ride.passenger_count} passenger(s)</span>
                          <span><i class="fas fa-clock mr-1"></i>${this.formatRideDate(ride.requested_at)}</span>
                          ${ride.distance_miles ? `<span><i class="fas fa-route mr-1"></i>${ride.distance_miles} mi away</span>` : ''}
                        </div>
                        ${ride.notes ? `<div class="mt-2 text-sm text-gray-600 italic">${ride.notes}</div>` : ''}
                      </div>
                      ${ride.status === 'requested' ? 
                        `<button onclick="app.acceptRideRequest(${ride.id})" 
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                          <i class="fas fa-check mr-1"></i>Accept
                         </button>` : 
                      ride.status === 'accepted' && ride.driver_id == this.currentUser?.id ?
                        `<button onclick="app.deacceptRide(${ride.id})" 
                                class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                          <i class="fas fa-undo mr-1"></i>Cancel Acceptance
                         </button>` : 
                        `<span class="text-sm px-3 py-2 bg-gray-100 text-gray-600 rounded-md">
                          ${ride.status === 'accepted' ? 'Accepted by ' + (ride.driver_name || 'another driver') : ride.status}
                         </span>`}
                    </div>
                  </div>
                `).join('') : `
                  <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-car text-4xl mb-2 opacity-50"></i>
                    <p>No ride requests available at the moment.</p>
                    <p class="text-sm">Make sure you're marked as available to see requests.</p>
                  </div>
                `}
              </div>
            </div>
          ` : ''}

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

  // Use utility functions from RideUtils class
  getRideStatusColor(status) {
    return RideUtils.getRideStatusColor(status)
  }

  getRideStatusBadge(status) {
    return RideUtils.getRideStatusBadge(status)
  }

  formatRideDate(dateString) {
    return RideUtils.formatRideDate(dateString)
  }

  getCurrentRides(rides) {
    return RideUtils.getCurrentRides(rides)
  }

  getHistoricalRides(rides) {
    return RideUtils.getHistoricalRides(rides)
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

  async toggleDriverAvailability() {
    const newAvailability = !this.currentUser.is_available
    
    try {
      // Update availability on server
      await axios.post('/api/user/location', {
        latitude: this.currentLocation?.latitude || 0,
        longitude: this.currentLocation?.longitude || 0,
        is_available: newAvailability
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      // Update local state
      this.currentUser.is_available = newAvailability
      
      // Refresh dashboard to update UI
      this.loadDashboard()
      
      this.showNotification(
        `Driver availability ${newAvailability ? 'enabled' : 'disabled'}. ${newAvailability ? 'You can now receive ride requests!' : 'You will not receive new ride requests.'}`, 
        'success'
      )
    } catch (error) {
      console.error('Failed to toggle availability:', error)
      this.showNotification('Failed to update driver availability', 'error')
    }
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
      this.clearRideTimeout(rideId) // Clear any timeout for this ride
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

  async acceptRideRequest(rideId) {
    if (!confirm('Are you sure you want to accept this ride request? This will assign you as the driver.')) {
      return
    }

    try {
      await axios.post(`/api/rides/${rideId}/accept`, {}, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      this.showNotification('Ride request accepted! You are now the assigned driver.', 'success')
      this.clearRideTimeout(rideId) // Clear timeout since ride is now accepted
      this.loadDashboard() // Reload to update both rider and driver views
    } catch (error) {
      console.error('Failed to accept ride:', error)
      this.showNotification(
        error.response?.data?.error || 'Failed to accept ride request', 
        'error'
      )
    }
  }

  async deacceptRide(rideId) {
    if (!confirm('Are you sure you want to cancel your acceptance? This will make the ride available for other drivers again.')) {
      return
    }

    try {
      await axios.post(`/api/rides/${rideId}/deaccept`, {}, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      this.showNotification('Ride acceptance cancelled. Request is now available for other drivers.', 'success')
      this.loadDashboard() // Reload dashboard
    } catch (error) {
      console.error('Failed to cancel ride acceptance:', error)
      this.showNotification(
        error.response?.data?.error || 'Failed to cancel ride acceptance', 
        'error'
      )
    }
  }

  async loadRideHistory() {
    console.log('Loading ride history...')
    const mainContent = document.getElementById('main-content')
    const sidebar = document.getElementById('sidebar-content')
    
    try {
      // Load ride history
      const response = await axios.get('/api/rides/history', { 
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      
      const historyData = response.data
      const rides = historyData.rides || []
      
      console.log('Ride history loaded:', rides.length, 'rides')
      
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-history mr-2 text-blue-600"></i>
              Ride History
            </h3>
            <span class="text-sm text-gray-600">${rides.length} total rides</span>
          </div>
          
          <div class="space-y-4">
            ${rides.length > 0 ? rides.map(ride => `
              <div class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <span class="text-lg font-medium">${ride.pickup_address || 'Pickup location'}</span>
                      <i class="fas fa-arrow-right mx-3 text-gray-400"></i>
                      <span class="text-lg font-medium">${ride.destination_address || 'Destination'}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-600 space-x-4">
                      <span><i class="fas fa-users mr-1"></i>${ride.group_name}</span>
                      <span><i class="fas fa-clock mr-1"></i>${this.formatRideDate(ride.requested_at)}</span>
                      <span><i class="fas fa-user-friends mr-1"></i>${ride.passenger_count} passenger(s)</span>
                      ${ride.requester_name !== this.currentUser?.name ? `<span><i class="fas fa-user mr-1"></i>Requested by: ${ride.requester_name}</span>` : ''}
                      ${ride.driver_name ? `<span><i class="fas fa-car mr-1"></i>Driver: ${ride.driver_name}</span>` : ''}
                    </div>
                    ${ride.notes ? `<div class="mt-2 text-sm text-gray-600 italic"><i class="fas fa-sticky-note mr-1"></i>${ride.notes}</div>` : ''}
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-sm px-3 py-1 rounded ${this.getRideStatusBadge(ride.status)}">
                      ${ride.status.replace('_', ' ')}
                    </span>
                    ${ride.requester_id == this.currentUser?.id ? 
                      `<button onclick="app.duplicateRide(${ride.id})" 
                              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium">
                        <i class="fas fa-copy mr-1"></i>Request Again
                       </button>` : ''}
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="text-center py-12 text-gray-500">
                <i class="fas fa-history text-4xl mb-4 opacity-50"></i>
                <p class="text-lg">No ride history yet.</p>
                <p class="text-sm">Your completed and cancelled rides will appear here.</p>
              </div>
            `}
          </div>
          
          ${historyData.total > 20 ? `
            <div class="mt-6 text-center">
              <p class="text-sm text-gray-600">Showing ${rides.length} of ${historyData.total} rides</p>
              <!-- Pagination can be added here in the future -->
            </div>
          ` : ''}
        </div>
      `
      
      // Keep sidebar empty or minimal for history page
      sidebar.innerHTML = `
        <div class="text-center">
          <h4 class="text-lg font-semibold mb-4">Quick Actions</h4>
          <button onclick="app.showDashboard()" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-2">
            <i class="fas fa-home mr-2"></i>Back to Dashboard
          </button>
          ${this.currentUser && this.currentUser.is_driver && this.currentUser.is_available ? 
            `<div class="bg-orange-100 text-orange-800 px-3 py-2 rounded text-sm text-center">
              <i class="fas fa-info-circle mr-1"></i>
              You're available as a driver<br>
              Ride requests are disabled
             </div>` :
            `<button onclick="showRequestRideModal()" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              <i class="fas fa-plus mr-2"></i>Request New Ride
             </button>`}
        </div>
      `
      
    } catch (error) {
      console.error('Failed to load ride history:', error)
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Failed to Load Ride History</h3>
          <p class="text-gray-600 mb-4">There was an error loading your ride history.</p>
          <button onclick="app.loadRideHistory()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Try Again
          </button>
        </div>
      `
    }
  }

  async duplicateRide(rideId) {
    if (!confirm('Do you want to create a new ride request with the same pickup and destination? This will make the request available to drivers in your group.')) {
      return
    }

    try {
      await axios.post(`/api/rides/${rideId}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      this.showNotification('Ride request created successfully! Check your dashboard to see the new request.', 'success')
      // Optionally switch to dashboard to see the new request
      this.showDashboard()
    } catch (error) {
      console.error('Failed to duplicate ride:', error)
      this.showNotification(
        error.response?.data?.error || 'Failed to create duplicate ride request', 
        'error'
      )
    }
  }

  // Delegate timeout methods to TimeoutManager
  startRideTimeout(rideId, rideData) {
    this.timeoutManager?.startRideTimeout(rideId, rideData)
  }

  clearRideTimeout(rideId) {
    this.timeoutManager?.clearRideTimeout(rideId)
  }

  // Delegate timeout methods to TimeoutManager
  monitorExistingRides(rides) {
    this.timeoutManager?.monitorExistingRides(rides, this.currentUser)
  }

  onRideStatusChanged(rideId, newStatus) {
    this.timeoutManager?.onRideStatusChanged(rideId, newStatus)
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
  
  // Initialize timeout manager
  app.timeoutManager = new TimeoutManager(app)
  
  // Make app and timeout manager globally available
  window.app = app
  window.timeoutManager = app.timeoutManager
  
  logger?.info('App instance created and made globally available')
})