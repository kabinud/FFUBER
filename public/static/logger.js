// Simple logging utility for production
class Logger {
  constructor() {
    this.isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname.includes('127.0.0.1') ||
                        window.location.hostname.includes('e2b.dev')
  }

  info(message, data = null) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '')
    }
  }

  warn(message, data = null) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '')
    }
  }

  error(message, error = null) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '')
    }
    // In production, you might want to send errors to a monitoring service
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  }
}

// Create global logger instance
window.logger = new Logger()