// Ride utility functions and formatting helpers
class RideUtils {
  static getRideStatusColor(status) {
    const colors = {
      'requested': 'border-yellow-400',
      'accepted': 'border-blue-400',
      'picked_up': 'border-purple-400',
      'completed': 'border-green-400',
      'cancelled': 'border-red-400'
    }
    return colors[status] || 'border-gray-400'
  }

  static getRideStatusBadge(status) {
    const badges = {
      'requested': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'picked_up': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  static formatRideDate(dateString) {
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
      logger?.error('Date formatting error', error)
      // Fallback to simple date formatting
      return new Date(dateString).toLocaleString()
    }
  }

  static getCurrentRides(rides) {
    // Current rides: requested, accepted, picked_up
    return rides.filter(ride => ['requested', 'accepted', 'picked_up'].includes(ride.status))
  }

  static getHistoricalRides(rides) {
    // Historical rides: completed, cancelled
    return rides.filter(ride => ['completed', 'cancelled'].includes(ride.status))
  }

  static formatDistance(distance) {
    if (!distance) return 'Unknown distance'
    
    const miles = parseFloat(distance)
    if (miles < 0.1) return '< 0.1 mi'
    if (miles < 1) return `${miles.toFixed(1)} mi`
    return `${miles.toFixed(1)} mi`
  }

  static calculateEstimatedTime(distance) {
    if (!distance) return 'Unknown'
    
    // Rough estimate: average city speed 25 mph
    const miles = parseFloat(distance)
    const hours = miles / 25
    const minutes = Math.round(hours * 60)
    
    if (minutes < 1) return '< 1 min'
    if (minutes < 60) return `${minutes} min`
    
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }

  static getRideIcon(status) {
    const icons = {
      'requested': 'fas fa-clock',
      'accepted': 'fas fa-check-circle',
      'picked_up': 'fas fa-car',
      'completed': 'fas fa-flag-checkered',
      'cancelled': 'fas fa-times-circle'
    }
    return icons[status] || 'fas fa-question-circle'
  }

  static getStatusDisplayName(status) {
    const names = {
      'requested': 'Requested',
      'accepted': 'Accepted',
      'picked_up': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    }
    return names[status] || status
  }
}