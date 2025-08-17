// Additional functionality for group management, rides, etc.

// Load groups for sidebar
async function loadGroupsSidebar() {
  const sidebar = document.getElementById('sidebar-content')
  const token = localStorage.getItem('authToken')
  
  if (!token || !sidebar) return
  
  try {
    const response = await axios.get('/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const groups = response.data.groups || []
    
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
  } catch (error) {
    console.error('Failed to load groups:', error)
    sidebar.innerHTML = `
      <h3 class="text-lg font-semibold mb-4">Your Groups</h3>
      <p class="text-gray-500 text-center py-4">Failed to load groups.</p>
      <button onclick="loadGroupsSidebar()" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">
        Try Again
      </button>
    `
  }
}

// Create Group Modal
function showCreateGroupModal() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
      <h3 class="text-2xl font-bold mb-6">Create New Group</h3>
      <form onsubmit="return handleCreateGroup(event)">
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
}

// Handle create group form submission
async function handleCreateGroup(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const token = localStorage.getItem('authToken')
  
  try {
    const response = await axios.post('/api/groups', {
      name: formData.get('name'),
      description: formData.get('description')
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Close modal
    event.target.closest('.fixed').remove()
    
    // Show success with invite code
    showGroupCreatedModal(response.data.group)
    
    // Reload dashboard to show new group
    if (window.app && window.app.loadDashboard) {
      window.app.loadDashboard()
    } else {
      loadGroupsSidebar()
    }
  } catch (error) {
    alert('Failed to create group: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

// Show group created success modal
function showGroupCreatedModal(group) {
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

// Join Group Modal
function showJoinGroupModal() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
      <h3 class="text-2xl font-bold mb-6">Join a Group</h3>
      <form onsubmit="return handleJoinGroup(event)">
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
  
  // Auto-uppercase input
  const input = modal.querySelector('[name="invite_code"]')
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase()
  })
}

// Handle join group
async function handleJoinGroup(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const token = localStorage.getItem('authToken')
  
  try {
    const response = await axios.post('/api/groups/join', {
      invite_code: formData.get('invite_code')
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    event.target.closest('.fixed').remove()
    alert(`Successfully joined "${response.data.group.name}"!`)
    
    // Reload dashboard to show new group
    if (window.app && window.app.loadDashboard) {
      window.app.loadDashboard()
    } else {
      loadGroupsSidebar()
    }
  } catch (error) {
    alert('Failed to join group: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

// Show invite code modal
function showInviteCode(inviteCode, groupName) {
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
          
          <button onclick="navigator.clipboard.writeText('Join our family rideshare group \\"${groupName}\\" using code: ${inviteCode}'); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied!'; setTimeout(() => this.innerHTML='<i class=\\'fas fa-share\\'></i> Copy Full Invitation', 2000)" 
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

// View group members
async function viewGroup(groupId) {
  const token = localStorage.getItem('authToken')
  
  try {
    const response = await axios.get(`/api/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const members = response.data.members
    const currentUserId = window.app?.currentUser?.id
    const isCurrentUserAdmin = members.find(m => m.id == currentUserId && m.is_admin)
    
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
                ${isCurrentUserAdmin && !member.is_admin && member.id != currentUserId ? `
                  <button onclick="transferAdmin(${groupId}, ${member.id}, '${member.name}')" 
                          class="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded">
                    Make Admin
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        ${isCurrentUserAdmin ? `
          <div class="border-t pt-4 mb-4">
            <h4 class="font-semibold text-red-600 mb-2">Admin Actions</h4>
            <div class="flex gap-2">
              <button onclick="confirmDeleteGroup(${groupId})" 
                      class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
                <i class="fas fa-trash mr-1"></i>Delete Group
              </button>
            </div>
          </div>
        ` : ''}
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
          Close
        </button>
      </div>
    `
    document.body.appendChild(modal)
    
  } catch (error) {
    alert('Failed to load group members: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Transfer admin rights
async function transferAdmin(groupId, newAdminId, newAdminName) {
  if (!confirm(`Are you sure you want to make ${newAdminName} the admin of this group? You will lose admin privileges.`)) {
    return
  }
  
  const token = localStorage.getItem('authToken')
  
  try {
    await axios.put(`/api/groups/${groupId}/transfer-admin`, {
      new_admin_id: newAdminId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    alert(`${newAdminName} is now the admin of this group.`)
    
    // Close modal and refresh dashboard
    document.querySelector('.fixed').remove()
    if (window.app && window.app.loadDashboard) {
      window.app.loadDashboard()
    }
  } catch (error) {
    alert('Failed to transfer admin rights: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Confirm delete group
function confirmDeleteGroup(groupId) {
  if (confirm('Are you sure you want to delete this group? This action cannot be undone and will delete all rides associated with this group.')) {
    deleteGroup(groupId)
  }
}

// Delete group
async function deleteGroup(groupId) {
  const token = localStorage.getItem('authToken')
  
  try {
    await axios.delete(`/api/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    alert('Group deleted successfully.')
    
    // Close modal and refresh dashboard
    document.querySelector('.fixed').remove()
    if (window.app && window.app.loadDashboard) {
      window.app.loadDashboard()
    }
  } catch (error) {
    alert('Failed to delete group: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Toggle driver status
async function toggleDriverStatus() {
  const token = localStorage.getItem('authToken')
  const isDriver = event.target.checked
  
  try {
    // Get current user data first
    const profileResponse = await axios.get('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const user = profileResponse.data.user
    
    await axios.put('/api/user/profile', {
      name: user.name,
      phone: user.phone,
      is_driver: isDriver
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    alert(`Driver status ${isDriver ? 'enabled' : 'disabled'}`)
    
    // Reload dashboard to show availability toggle if needed
    if (window.app && window.app.loadDashboard) {
      window.app.loadDashboard()
    }
  } catch (error) {
    event.target.checked = !isDriver
    alert('Failed to update driver status')
  }
}

// Request ride modal
async function showRequestRideModal() {
  const token = localStorage.getItem('authToken')
  
  try {
    // Get user's groups first
    const response = await axios.get('/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const groups = response.data.groups || []
    
    if (groups.length === 0) {
      alert('Please create or join a group first to request rides within your trusted circle.')
      return
    }
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-2xl font-bold mb-6">Request a Ride</h3>
        <form onsubmit="return handleRideRequest(event)">
          
          <!-- Group Selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Select Group</label>
            <select name="group_id" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Choose a group...</option>
              ${groups.map(group => `
                <option value="${group.id}">${group.name} (${group.member_count} members)</option>
              `).join('')}
            </select>
          </div>
          
          <!-- Pickup Location -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Pickup Location</label>
            <div class="relative">
              <input type="text" name="pickup_address" required placeholder="Enter pickup address..." 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" 
                     oninput="handleAddressAutocomplete(this, 'pickup')"
                     onchange="geocodeAddress(this, 'pickup')"
                     autocomplete="off" />
              <div id="pickup_suggestions" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 hidden max-h-48 overflow-y-auto"></div>
            </div>
            <input type="hidden" name="pickup_latitude" />
            <input type="hidden" name="pickup_longitude" />
            <button type="button" onclick="getCurrentLocationAddress('pickup')" 
                    class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded">
              <i class="fas fa-location-arrow mr-1"></i>Use Current Location
            </button>
          </div>
          
          <!-- Destination -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Destination</label>
            <div class="relative">
              <input type="text" name="destination_address" required placeholder="Enter destination address..." 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                     oninput="handleAddressAutocomplete(this, 'destination')"
                     onchange="geocodeAddress(this, 'destination')"
                     autocomplete="off" />
              <div id="destination_suggestions" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 hidden max-h-48 overflow-y-auto"></div>
            </div>
            <input type="hidden" name="destination_latitude" />
            <input type="hidden" name="destination_longitude" />
            <button type="button" onclick="getCurrentLocationAddress('destination')" 
                    class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded">
              <i class="fas fa-location-arrow mr-1"></i>Use Current Location
            </button>
          </div>
          
          <!-- Additional Details -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">Passengers</label>
              <select name="passenger_count" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5">5+ people</option>
              </select>
            </div>
          </div>
          
          <!-- Notes -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Special Notes (optional)</label>
            <textarea name="notes" rows="2" placeholder="Any special instructions, timing preferences, etc." 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
              <i class="fas fa-car mr-2"></i>Request Ride
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
    
  } catch (error) {
    console.error('Failed to load groups:', error)
    alert('Failed to load groups. Please try again.')
  }
}

// Get current location and convert to address
function getCurrentLocationAddress(type) {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.')
    return
  }
  
  navigator.geolocation.getCurrentPosition(
    async function(position) {
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      
      // Fill in the coordinates
      document.querySelector(`[name="${type}_latitude"]`).value = lat
      document.querySelector(`[name="${type}_longitude"]`).value = lng
      
      // Try to get address from coordinates (reverse geocoding)
      try {
        const address = await reverseGeocode(lat, lng)
        const addressField = document.querySelector(`[name="${type}_address"]`)
        addressField.value = address
      } catch (error) {
        console.error('Reverse geocoding failed:', error)
        // Fallback to coordinates
        const addressField = document.querySelector(`[name="${type}_address"]`)
        addressField.value = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      }
    },
    function(error) {
      alert('Unable to get your location: ' + error.message)
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  )
}

// Geocode address to coordinates
async function geocodeAddress(inputElement, type) {
  const address = inputElement.value.trim()
  if (!address) return
  
  try {
    const coords = await forwardGeocode(address)
    document.querySelector(`[name="${type}_latitude"]`).value = coords.lat
    document.querySelector(`[name="${type}_longitude"]`).value = coords.lng
  } catch (error) {
    console.error('Geocoding failed:', error)
    // Don't show error to user for every keystroke, just log it
  }
}

// Simple forward geocoding using Nominatim (OpenStreetMap)
async function forwardGeocode(address) {
  const encodedAddress = encodeURIComponent(address)
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`)
  const data = await response.json()
  
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    }
  } else {
    throw new Error('Address not found')
  }
}

// Make forwardGeocode globally accessible
window.forwardGeocode = forwardGeocode

// Simple reverse geocoding using Nominatim (OpenStreetMap)
async function reverseGeocode(lat, lng) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
  const data = await response.json()
  
  if (data && data.display_name) {
    return data.display_name
  } else {
    throw new Error('Address not found')
  }
}

// Address autocomplete using Nominatim (OpenStreetMap)
let autocompleteTimeout = null

async function handleAddressAutocomplete(input, type) {
  const query = input.value.trim()
  const suggestionsDiv = document.getElementById(`${type}_suggestions`)
  
  // Clear previous timeout
  if (autocompleteTimeout) {
    clearTimeout(autocompleteTimeout)
  }
  
  // Hide suggestions if query is too short
  if (query.length < 3) {
    suggestionsDiv.classList.add('hidden')
    suggestionsDiv.innerHTML = ''
    return
  }
  
  // Debounce the API call
  autocompleteTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        displayAddressSuggestions(data, type, input)
      } else {
        suggestionsDiv.classList.add('hidden')
        suggestionsDiv.innerHTML = ''
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
      suggestionsDiv.classList.add('hidden') 
      suggestionsDiv.innerHTML = ''
    }
  }, 300) // 300ms debounce
}

function displayAddressSuggestions(suggestions, type, input) {
  const suggestionsDiv = document.getElementById(`${type}_suggestions`)
  
  suggestionsDiv.innerHTML = suggestions.map(suggestion => `
    <div class="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0" 
         onclick="selectAddressSuggestion('${suggestion.display_name.replace(/'/g, "\\'")}', ${suggestion.lat}, ${suggestion.lon}, '${type}', this)">
      <div class="font-medium text-sm">${getShortAddress(suggestion)}</div>
      <div class="text-xs text-gray-600">${suggestion.display_name}</div>
    </div>
  `).join('')
  
  suggestionsDiv.classList.remove('hidden')
}

function getShortAddress(suggestion) {
  // Try to create a concise address from the components
  const addr = suggestion.address || {}
  const parts = []
  
  if (addr.house_number && addr.road) {
    parts.push(`${addr.house_number} ${addr.road}`)
  } else if (addr.road) {
    parts.push(addr.road)
  } else if (suggestion.name) {
    parts.push(suggestion.name)
  }
  
  if (addr.city || addr.town || addr.village) {
    parts.push(addr.city || addr.town || addr.village)
  }
  
  if (addr.state) {
    parts.push(addr.state)
  }
  
  return parts.length > 0 ? parts.join(', ') : suggestion.display_name.split(',').slice(0, 2).join(', ')
}

function selectAddressSuggestion(address, lat, lng, type, element) {
  // Fill the input fields
  const addressInput = document.querySelector(`input[name="${type}_address"]`)
  const latInput = document.querySelector(`input[name="${type}_latitude"]`)
  const lngInput = document.querySelector(`input[name="${type}_longitude"]`)
  
  addressInput.value = address
  latInput.value = lat
  lngInput.value = lng
  
  // Hide suggestions
  const suggestionsDiv = document.getElementById(`${type}_suggestions`)
  suggestionsDiv.classList.add('hidden')
  suggestionsDiv.innerHTML = ''
}

// Hide suggestions when clicking outside
document.addEventListener('click', function(event) {
  const suggestionDivs = document.querySelectorAll('[id$="_suggestions"]')
  suggestionDivs.forEach(div => {
    if (!div.contains(event.target) && !div.previousElementSibling.contains(event.target)) {
      div.classList.add('hidden')
      div.innerHTML = ''
    }
  })
})

// Helper functions for edit modal
async function geocodeAddressForEdit(input, type) {
  const address = input.value.trim()
  if (!address) return
  
  try {
    const coords = await forwardGeocode(address)
    document.querySelector(`input[name="${type}_latitude"]`).value = coords.lat
    document.querySelector(`input[name="${type}_longitude"]`).value = coords.lng
  } catch (error) {
    console.error('Geocoding failed:', error)
  }
}

async function getCurrentLocationAddressForEdit(type) {
  if (!'geolocation' in navigator) {
    alert('Geolocation is not supported by this browser.')
    return
  }
  
  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const address = await reverseGeocode(lat, lng)
      
      document.querySelector(`input[name="${type}_address"]`).value = address
      document.querySelector(`input[name="${type}_latitude"]`).value = lat
      document.querySelector(`input[name="${type}_longitude"]`).value = lng
    } catch (error) {
      console.error('Failed to get address for current location:', error)
      alert('Failed to get address for your current location.')
    }
  }, (error) => {
    console.error('Geolocation error:', error)
    alert('Failed to get your current location.')
  })
}

// Handle ride request form submission
async function handleRideRequest(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const token = localStorage.getItem('authToken')
  
  // Get coordinates (try to geocode if missing)
  let pickupLat = formData.get('pickup_latitude')
  let pickupLng = formData.get('pickup_longitude')
  let destLat = formData.get('destination_latitude')
  let destLng = formData.get('destination_longitude')
  
  const pickupAddress = formData.get('pickup_address')
  const destinationAddress = formData.get('destination_address')
  
  // If coordinates are missing, try to geocode the addresses
  try {
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
  } catch (error) {
    alert('Unable to find the addresses you entered. Please check and try again.')
    return false
  }
  
  if (!pickupLat || !pickupLng || !destLat || !destLng) {
    alert('Please provide valid addresses for both pickup and destination locations.')
    return false
  }
  
  try {
    const response = await axios.post('/api/rides', {
      group_id: parseInt(formData.get('group_id')),
      pickup_latitude: parseFloat(pickupLat),
      pickup_longitude: parseFloat(pickupLng),
      pickup_address: formData.get('pickup_address'),
      destination_latitude: parseFloat(destLat),
      destination_longitude: parseFloat(destLng),
      destination_address: formData.get('destination_address'),
      passenger_count: parseInt(formData.get('passenger_count')),
      notes: formData.get('notes')
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Close modal
    event.target.closest('.fixed').remove()
    
    // Show success message
    showRideRequestSuccessModal(response.data.ride)
    
    // Reload dashboard to show new ride
    if (window.app && window.app.loadDashboard) {
      window.app.loadDashboard()
    }
    
  } catch (error) {
    console.error('Ride request error:', error)
    alert('Failed to create ride request: ' + (error.response?.data?.error || 'Unknown error'))
  }
  return false
}

// Show ride request success modal
function showRideRequestSuccessModal(ride) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <i class="fas fa-check text-green-600 text-xl"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">Ride Request Sent!</h3>
        <p class="text-gray-600 mb-6">Your ride request has been sent to available drivers in your group. You'll be notified when someone accepts.</p>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-6 text-left">
          <div class="text-sm space-y-2">
            <div><strong>From:</strong> ${ride.pickup_address}</div>
            <div><strong>To:</strong> ${ride.destination_address}</div>
            <div><strong>Passengers:</strong> ${ride.passenger_count}</div>
            ${ride.notes ? `<div><strong>Notes:</strong> ${ride.notes}</div>` : ''}
          </div>
        </div>
        
        <div class="space-y-3">
          <button onclick="viewRideStatus(${ride.id})" 
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
            <i class="fas fa-eye mr-2"></i>View Ride Status
          </button>
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
            Done
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

// View ride status (placeholder for now)
async function viewRideStatus(rideId) {
  const token = localStorage.getItem('authToken')
  
  try {
    const response = await axios.get(`/api/rides/${rideId}/available-drivers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const drivers = response.data.drivers || []
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">Available Drivers</h3>
        
        ${drivers.length > 0 ? `
          <div class="space-y-3 mb-6">
            ${drivers.map(driver => `
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-car text-green-600"></i>
                  </div>
                  <div>
                    <p class="font-medium">${driver.name}</p>
                    <p class="text-sm text-gray-600">${driver.distance.toFixed(1)} km away</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium">${driver.estimatedArrival} min</div>
                  <div class="text-xs text-gray-500">ETA</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-8">
            <i class="fas fa-clock text-gray-400 text-3xl mb-4"></i>
            <p class="text-gray-600 mb-2">No drivers currently available</p>
            <p class="text-sm text-gray-500">Available drivers in your group will see this request</p>
          </div>
        `}
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
          Close
        </button>
      </div>
    `
    document.body.appendChild(modal)
    
  } catch (error) {
    alert('Failed to load ride status: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

console.log('Features.js loaded successfully')