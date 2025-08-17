// Ride timeout and Uber integration manager
class TimeoutManager {
  constructor(app) {
    this.app = app
    this.rideTimeouts = new Map()
  }

  // Ride timeout monitoring system
  startRideTimeout(rideId, rideData) {
    logger?.info('Starting timeout monitor for ride', rideId)
    
    // Clear any existing timeout for this ride
    this.clearRideTimeout(rideId)
    
    // Set timeout for 5 minutes (300 seconds)
    const timeoutId = setTimeout(() => {
      this.handleRideTimeout(rideId, rideData)
    }, 300000) // 5 minutes in milliseconds
    
    this.rideTimeouts.set(rideId, {
      timeoutId,
      rideData,
      startTime: Date.now()
    })
  }

  clearRideTimeout(rideId) {
    const timeoutData = this.rideTimeouts.get(rideId)
    if (timeoutData) {
      clearTimeout(timeoutData.timeoutId)
      this.rideTimeouts.delete(rideId)
      logger?.info('Cleared timeout for ride', rideId)
    }
  }

  async handleRideTimeout(rideId, rideData) {
    logger?.info('Ride timeout triggered for', rideId)
    
    try {
      // Check if ride is still in requested status
      const response = await axios.get('/api/rides', {
        headers: { Authorization: `Bearer ${this.app.authToken}` }
      })
      
      const currentRide = response.data.rides.find(r => r.id === rideId)
      
      // Only show timeout if ride is still in requested status
      if (currentRide && currentRide.status === 'requested') {
        this.showRideTimeoutModal(rideId, rideData)
      } else {
        // Ride was accepted or cancelled, clean up timeout
        this.clearRideTimeout(rideId)
      }
    } catch (error) {
      logger?.error('Error checking ride status', error)
      // Still show timeout modal in case of error
      this.showRideTimeoutModal(rideId, rideData)
    }
  }

  showRideTimeoutModal(rideId, rideData) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div class="text-center">
          <i class="fas fa-clock text-4xl text-orange-500 mb-4"></i>
          <h3 class="text-xl font-bold mb-4">No Response Yet</h3>
          <p class="text-gray-600 mb-6">
            It's been 5 minutes since you requested a ride. No family or friends are available right now.
          </p>
          
          <div class="space-y-3">
            <button onclick="window.timeoutManager.launchUber('${rideData.pickup_address}', '${rideData.destination_address}', ${rideData.pickup_latitude}, ${rideData.pickup_longitude}, ${rideData.destination_latitude}, ${rideData.destination_longitude})"
                    class="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800">
              <i class="fas fa-car mr-2"></i>Try Uber Instead
            </button>
            
            <button onclick="window.timeoutManager.keepWaitingForRide(${rideId}); this.closest('.fixed').remove()"
                    class="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700">
              <i class="fas fa-clock mr-2"></i>Keep Waiting (5 more minutes)
            </button>
            
            <button onclick="window.app.cancelRide(${rideId}); this.closest('.fixed').remove()"
                    class="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700">
              <i class="fas fa-times mr-2"></i>Cancel Request
            </button>
            
            <button onclick="this.closest('.fixed').remove()"
                    class="w-full border border-gray-300 px-4 py-3 rounded-lg font-medium hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  }

  launchUber(pickupAddress, destinationAddress, pickupLat, pickupLng, destLat, destLng) {
    // Generate Uber deep link
    const uberUrl = this.generateUberUrl(pickupAddress, destinationAddress, pickupLat, pickupLng, destLat, destLng)
    
    // Try to open Uber app, fallback to web
    window.open(uberUrl, '_blank')
    
    this.app.showNotification('Opening Uber app...', 'info')
  }

  generateUberUrl(pickupAddress, destinationAddress, pickupLat, pickupLng, destLat, destLng) {
    // Uber deep link format
    const baseUrl = 'https://m.uber.com/ul/'
    const params = new URLSearchParams({
      'action': 'setPickup',
      'pickup[latitude]': pickupLat,
      'pickup[longitude]': pickupLng,
      'pickup[nickname]': pickupAddress || 'Pickup Location',
      'dropoff[latitude]': destLat,
      'dropoff[longitude]': destLng,
      'dropoff[nickname]': destinationAddress || 'Destination'
    })
    
    return baseUrl + '?' + params.toString()
  }

  keepWaitingForRide(rideId) {
    // Restart the timeout for another 5 minutes
    const timeoutData = this.rideTimeouts.get(rideId)
    if (timeoutData) {
      this.startRideTimeout(rideId, timeoutData.rideData)
    }
    
    this.app.showNotification('We\'ll check again in 5 minutes if no one accepts your ride.', 'info')
  }

  // Monitor existing rides when dashboard loads
  monitorExistingRides(rides, currentUser) {
    const userRequestedRides = rides.filter(ride => 
      ride.requester_id == currentUser?.id && ride.status === 'requested'
    )
    
    userRequestedRides.forEach(ride => {
      // Only start timeout if not already monitoring this ride
      if (!this.rideTimeouts.has(ride.id)) {
        // Calculate remaining time (if ride was requested less than 5 minutes ago)
        const rideAge = Date.now() - new Date(ride.requested_at).getTime()
        const remainingTime = Math.max(0, 300000 - rideAge) // 5 minutes - age
        
        if (remainingTime > 0) {
          logger?.info(`Starting timeout for existing ride ${ride.id} with ${Math.round(remainingTime/1000)}s remaining`)
          
          const timeoutId = setTimeout(() => {
            this.handleRideTimeout(ride.id, ride)
          }, remainingTime)
          
          this.rideTimeouts.set(ride.id, {
            timeoutId,
            rideData: ride,
            startTime: new Date(ride.requested_at).getTime()
          })
        } else {
          // Ride is already older than 5 minutes, trigger timeout immediately
          logger?.info(`Ride ${ride.id} is already past timeout, triggering now`)
          setTimeout(() => this.handleRideTimeout(ride.id, ride), 1000)
        }
      }
    })
  }

  // Clear timeouts when rides are accepted or cancelled
  onRideStatusChanged(rideId, newStatus) {
    if (['accepted', 'cancelled', 'completed'].includes(newStatus)) {
      this.clearRideTimeout(rideId)
    }
  }

  // Cleanup all timeouts
  cleanup() {
    this.rideTimeouts.forEach((timeoutData) => {
      clearTimeout(timeoutData.timeoutId)
    })
    this.rideTimeouts.clear()
  }
}