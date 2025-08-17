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
    
    // Reload sidebar
    loadGroupsSidebar()
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
    loadGroupsSidebar()
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
    alert('Failed to load group members: ' + (error.response?.data?.error || 'Unknown error'))
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
function showRequestRideModal() {
  alert('Ride request feature - Coming soon! Create groups first to request rides within your trusted circle.')
}

console.log('Features.js loaded successfully')