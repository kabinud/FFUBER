// Centralized API client with error handling and optimization
class ApiClient {
  constructor() {
    this.baseURL = ''
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
    
    // Setup axios interceptors for global error handling
    this.setupInterceptors()
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        logger?.error('Request interceptor error', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor for global error handling
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('authToken')
          if (window.app) {
            window.app.currentUser = null
            window.app.authToken = null
            window.app.showApp = false
          }
          logger?.warn('Session expired, redirecting to login')
        }
        
        logger?.error('API Error', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.response?.data?.error || error.message
        })
        
        return Promise.reject(error)
      }
    )
  }

  // Helper method to make authenticated requests
  async makeRequest(method, url, data = null, options = {}) {
    try {
      const config = {
        method,
        url,
        ...options
      }
      
      if (data) {
        config.data = data
      }

      const response = await axios(config)
      return response.data
    } catch (error) {
      // Error is already logged by interceptor
      throw error
    }
  }

  // Auth API methods
  async login(email) {
    return this.makeRequest('POST', '/api/auth/login', { email })
  }

  async register(userData) {
    return this.makeRequest('POST', '/api/auth/register', userData)
  }

  async logout() {
    return this.makeRequest('POST', '/api/auth/logout')
  }

  // User API methods
  async getUserProfile() {
    return this.makeRequest('GET', '/api/user/profile')
  }

  async updateLocation(latitude, longitude, isAvailable) {
    return this.makeRequest('POST', '/api/user/location', {
      latitude,
      longitude,
      is_available: isAvailable
    })
  }

  async toggleDriverAvailability() {
    return this.makeRequest('POST', '/api/user/toggle-driver')
  }

  // Rides API methods
  async getRides() {
    return this.makeRequest('GET', '/api/rides')
  }

  async createRide(rideData) {
    return this.makeRequest('POST', '/api/rides', rideData)
  }

  async updateRide(rideId, updates) {
    return this.makeRequest('PUT', `/api/rides/${rideId}`, updates)
  }

  async cancelRide(rideId) {
    return this.makeRequest('DELETE', `/api/rides/${rideId}`)
  }

  async acceptRide(rideId) {
    return this.makeRequest('POST', `/api/rides/${rideId}/accept`)
  }

  async updateRideStatus(rideId, status) {
    return this.makeRequest('POST', `/api/rides/${rideId}/status`, { status })
  }

  async duplicateRide(rideId) {
    return this.makeRequest('POST', `/api/rides/${rideId}/duplicate`)
  }

  async getRideHistory(page = 1, limit = 50) {
    return this.makeRequest('GET', `/api/rides/history?page=${page}&limit=${limit}`)
  }

  // Groups API methods
  async getGroups() {
    return this.makeRequest('GET', '/api/groups')
  }

  async createGroup(groupData) {
    return this.makeRequest('POST', '/api/groups', groupData)
  }

  async joinGroup(groupId) {
    return this.makeRequest('POST', `/api/groups/${groupId}/join`)
  }

  async leaveGroup(groupId) {
    return this.makeRequest('POST', `/api/groups/${groupId}/leave`)
  }

  // Geocoding API methods (external API calls)
  async geocodeAddress(address) {
    try {
      const encodedAddress = encodeURIComponent(address)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`
      )
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0]
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          display_name: result.display_name
        }
      }
      
      throw new Error('Address not found')
    } catch (error) {
      logger?.error('Geocoding error', error)
      throw error
    }
  }

  async reverseGeocode(latitude, longitude) {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      )
      
      if (response.data && response.data.display_name) {
        return {
          address: response.data.display_name,
          latitude: parseFloat(response.data.lat),
          longitude: parseFloat(response.data.lon)
        }
      }
      
      throw new Error('Address not found')
    } catch (error) {
      logger?.error('Reverse geocoding error', error)
      throw error
    }
  }

  async getAddressSuggestions(query, limit = 5) {
    try {
      if (!query || query.length < 3) return []
      
      const encodedQuery = encodeURIComponent(query)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=${limit}&countrycodes=us&addressdetails=1`
      )
      
      return response.data.map(result => ({
        display_name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      }))
    } catch (error) {
      logger?.error('Address suggestions error', error)
      return []
    }
  }

  // Utility method for batch operations
  async batchRequest(requests) {
    try {
      const promises = requests.map(req => this.makeRequest(req.method, req.url, req.data, req.options))
      return await Promise.allSettled(promises)
    } catch (error) {
      logger?.error('Batch request error', error)
      throw error
    }
  }

  // Cache for frequently accessed data
  cache = new Map()

  async getCachedData(key, fetchFn, ttl = 300000) { // 5 minutes default TTL
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data
    }

    try {
      const data = await fetchFn()
      this.cache.set(key, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      logger?.error('Cache fetch error', error)
      throw error
    }
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}

// Create and export global API client instance
window.apiClient = new ApiClient()