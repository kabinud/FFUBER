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
    // Navigation buttons
    document.getElementById('login-btn')?.addEventListener('click', () => this.showLoginModal())
    document.getElementById('register-btn')?.addEventListener('click', () => this.showRegisterModal())
    document.getElementById('get-started-btn')?.addEventListener('click', () => this.showRegisterModal())

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
    document.getElementById('login-modal').classList.remove('hidden')
  }

  hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden')
    document.getElementById('login-form').reset()
  }

  showRegisterModal() {
    document.getElementById('register-modal').classList.remove('hidden')
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
    console.log('Showing app for user:', this.currentUser?.name)
    document.getElementById('landing-page').classList.add('hidden')
    document.getElementById('app-content').classList.remove('hidden')
    this.updateNavigation()
    this.loadDashboard()
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
    const mainContent = document.getElementById('main-content')
    const sidebar = document.getElementById('sidebar-content')

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

      console.log('Rendering dashboard HTML...')
      
      // Simple test content first
      mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 class="text-2xl font-bold mb-4">Dashboard</h2>
          <p class="mb-4">Welcome back, ${this.currentUser ? this.currentUser.name : 'User'}!</p>
          
          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="text-lg font-semibold mb-3">Driver Status</h3>
              <label class="flex items-center">
                <input type="checkbox" ${this.currentUser && this.currentUser.is_driver ? 'checked' : ''} 
                       onchange="app.toggleDriverStatus()" class="mr-2">
                I can drive others
              </label>
            </div>
            
            <div>
              <h3 class="text-lg font-semibold mb-3">Quick Actions</h3>
              <div class="flex gap-2">
                <button onclick="app.showCreateGroupModal()" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                  Create Group
                </button>
                <button onclick="app.showJoinGroupModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                  Join Group
                </button>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3">Groups: ${groups.length}</h3>
            <h3 class="text-lg font-semibold mb-3">Rides: ${rides.length}</h3>
          </div>
          
          <button onclick="app.showRequestRideModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <i class="fas fa-car mr-2"></i>Request Ride
          </button>
        </div>`
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">Dashboard</h2>
          <button onclick="app.showRequestRideModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <i class="fas fa-car mr-2"></i>Request Ride
          </button>
        </div>
        
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="text-lg font-semibold mb-3">Driver Status</h3>
            <div class="flex items-center gap-4">
              <label class="flex items-center">
                <input type="checkbox" ${this.currentUser.is_driver ? 'checked' : ''} 
                       onchange="app.toggleDriverStatus()" class="mr-2">
                I can drive others
              </label>
              ${this.currentUser.is_driver ? `
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
              <button onclick="app.showCreateGroupModal()" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                Create Group
              </button>
              <button onclick="app.showJoinGroupModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                Join Group
              </button>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Recent Rides</h3>
          <div class="space-y-2">
            ${rides.length > 0 ? rides.map(ride => `
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
                  ${ride.group_name} • ${dayjs(ride.requested_at).fromNow()}
                  ${ride.driver_name ? ` • Driver: ${ride.driver_name}` : ''}
                </div>
              </div>
            `).join('') : '<p class="text-gray-500 text-center py-4">No rides yet. Request your first ride!</p>'}
          </div>
        </div>
      </div>
      `

      console.log('Rendering sidebar HTML...')
      // Simple sidebar content
      sidebar.innerHTML = '<h3 class="text-lg font-semibold mb-4">Your Groups (' + groups.length + ')</h3>'
      
      if (groups.length === 0) {
        sidebar.innerHTML += '<p class="text-gray-500 text-center py-4">No groups yet.</p>'
        sidebar.innerHTML += '<button onclick="app.showCreateGroupModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">Create First Group</button>'
      } else {
        sidebar.innerHTML += '<div class="space-y-3">'
        groups.forEach(group => {
          sidebar.innerHTML += '<div class="border rounded-lg p-3"><h4 class="font-medium">' + group.name + '</h4><p class="text-sm text-gray-600">' + group.member_count + ' members</p></div>'
        })
        sidebar.innerHTML += '</div>'
      }
      
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

  showRequestRideModal() {
    // Create and show ride request modal
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-2xl font-bold mb-6">Request a Ride</h3>
        <form id="ride-request-form">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Select Group</label>
            <select name="group_id" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Choose a group...</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Pickup Location</label>
            <input type="text" name="pickup_address" placeholder="Enter pickup address" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <button type="button" onclick="app.useCurrentLocation('pickup')" 
                    class="text-sm text-blue-600 hover:underline mt-1">Use current location</button>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Destination</label>
            <input type="text" name="destination_address" placeholder="Enter destination" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Passengers</label>
            <select name="passenger_count" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="1">1 passenger</option>
              <option value="2">2 passengers</option>
              <option value="3">3 passengers</option>
              <option value="4">4+ passengers</option>
            </select>
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea name="notes" rows="3" placeholder="Any special instructions..." 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
          </div>
          
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
              Request Ride
            </button>
            <button type="button" onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `
    document.body.appendChild(modal)

    // Load groups for the dropdown
    this.loadGroupsForModal(modal.querySelector('[name="group_id"]'))

    // Handle form submission
    modal.querySelector('#ride-request-form').addEventListener('submit', (e) => this.handleRideRequest(e, modal))
  }

  async loadGroupsForModal(selectElement) {
    try {
      const response = await axios.get('/api/groups', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      const groups = response.data.groups
      
      groups.forEach(group => {
        const option = document.createElement('option')
        option.value = group.id
        option.textContent = group.name
        selectElement.appendChild(option)
      })
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  async handleRideRequest(e, modal) {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Get coordinates for addresses (simplified - in real app would use geocoding)
    const pickupCoords = this.currentLocation || { latitude: 40.7128, longitude: -74.0060 }
    const destCoords = { latitude: 40.7282, longitude: -74.0776 } // Simplified

    try {
      await axios.post('/api/rides', {
        group_id: parseInt(formData.get('group_id')),
        pickup_latitude: pickupCoords.latitude,
        pickup_longitude: pickupCoords.longitude,
        pickup_address: formData.get('pickup_address'),
        destination_latitude: destCoords.latitude,
        destination_longitude: destCoords.longitude,
        destination_address: formData.get('destination_address'),
        passenger_count: parseInt(formData.get('passenger_count')),
        notes: formData.get('notes')
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })

      modal.remove()
      this.loadDashboard()
      this.showNotification('Ride request sent! Available drivers will be notified.', 'success')
    } catch (error) {
      this.showNotification(error.response?.data?.error || 'Failed to request ride', 'error')
    }
  }

  useCurrentLocation(type) {
    if (this.currentLocation) {
      const addressField = document.querySelector(`[name="${type}_address"]`)
      addressField.value = `Current location (${this.currentLocation.latitude.toFixed(4)}, ${this.currentLocation.longitude.toFixed(4)})`
    } else {
      this.showNotification('Location not available. Please enable location sharing.', 'error')
    }
  }

  showGroupCreatedModal(group) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <i class="fas fa-check text-green-600 text-xl"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Group Created Successfully!</h3>
          <p class="text-gray-600 mb-6">Share this invite code with your family and friends:</p>
          
          <div class="mb-6">
            <div class="invite-code text-2xl font-bold text-blue-600 mb-2">${group.invite_code}</div>
            <p class="text-sm text-gray-500">Group: ${group.name}</p>
          </div>
          
          <div class="flex gap-3">
            <button onclick="navigator.clipboard.writeText('${group.invite_code}'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy Code', 2000)" 
                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm">
              Copy Code
            </button>
            <button onclick="navigator.clipboard.writeText('Join our family rideshare group with code: ${group.invite_code}'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy Message', 2000)" 
                    class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm">
              Copy Message
            </button>
          </div>
          
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
            Done
          </button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  showCreateGroupModal() {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold mb-6">Create New Group</h3>
        <form id="create-group-form">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Group Name</label>
            <input type="text" name="name" required placeholder="e.g., Johnson Family" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea name="description" rows="3" placeholder="Describe your rideshare group..." 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
          </div>
          
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
              Create Group
            </button>
            <button type="button" onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `
    document.body.appendChild(modal)

    modal.querySelector('#create-group-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      
      try {
        const response = await axios.post('/api/groups', {
          name: formData.get('name'),
          description: formData.get('description')
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        })

        modal.remove()
        this.showGroupCreatedModal(response.data.group)
        this.loadDashboard()
      } catch (error) {
        this.showNotification(error.response?.data?.error || 'Failed to create group', 'error')
      }
    })
  }

  showJoinGroupModal() {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold mb-6">Join a Group</h3>
        <form id="join-group-form">
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Invite Code</label>
            <input type="text" name="invite_code" required placeholder="Enter 8-character invite code" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-mono text-lg" 
                   maxlength="8" style="text-transform: uppercase;" />
          </div>
          
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md">
              Join Group
            </button>
            <button type="button" onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `
    document.body.appendChild(modal)

    modal.querySelector('[name="invite_code"]').addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase()
    })

    modal.querySelector('#join-group-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      
      try {
        const response = await axios.post('/api/groups/join', {
          invite_code: formData.get('invite_code')
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        })

        modal.remove()
        this.loadDashboard()
        this.showNotification(`Successfully joined "${response.data.group.name}"!`, 'success')
      } catch (error) {
        this.showNotification(error.response?.data?.error || 'Failed to join group', 'error')
      }
    })
  }

  showInviteCode(inviteCode, groupName) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Invite Friends & Family</h3>
          <p class="text-gray-600 mb-6">Share this code to invite people to "${groupName}":</p>
          
          <div class="mb-6">
            <div class="invite-code text-3xl font-bold text-blue-600 mb-3">${inviteCode}</div>
            <p class="text-sm text-gray-500">This code never expires and can be shared multiple times</p>
          </div>
          
          <div class="space-y-3 mb-4">
            <button onclick="navigator.clipboard.writeText('${inviteCode}'); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied!'; setTimeout(() => this.innerHTML='<i class=\\'fas fa-copy\\'></i> Copy Invite Code', 2000)" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md">
              <i class="fas fa-copy"></i> Copy Invite Code
            </button>
            
            <button onclick="navigator.clipboard.writeText('Join our family rideshare group \\"${groupName}\\" using code: ${inviteCode}\\n\\nDownload the app at: ${window.location.origin}'); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied!'; setTimeout(() => this.innerHTML='<i class=\\'fas fa-share\\'></i> Copy Full Invitation', 2000)" 
                    class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md">
              <i class="fas fa-share"></i> Copy Full Invitation
            </button>
          </div>
          
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
            Close
          </button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  async viewGroup(groupId) {
    try {
      const response = await axios.get(`/api/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
      
      const members = response.data.members
      
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
          <h3 class="text-xl font-bold mb-4">Group Members</h3>
          
          <div class="space-y-3 mb-6">
            ${members.map(member => `
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-blue-600"></i>
                  </div>
                  <div>
                    <p class="font-medium">${member.name}</p>
                    <p class="text-sm text-gray-600">${member.email}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  ${member.is_admin ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>' : ''}
                  ${member.is_driver ? `
                    <span class="text-xs px-2 py-1 rounded ${member.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                      ${member.is_available ? 'Available' : 'Driver'}
                    </span>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
            Close
          </button>
        </div>
      `
      document.body.appendChild(modal)
      
    } catch (error) {
      this.showNotification('Failed to load group members', 'error')
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
})