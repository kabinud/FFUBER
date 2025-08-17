# Family Rideshare App

## Project Overview
- **Name**: Family Rideshare
- **Goal**: Create a private Uber-like rideshare platform for trusted friends and family members
- **Features**: 
  - Private group-based ridesharing
  - Location-based driver matching
  - Real-time ride tracking
  - Simple authentication system
  - Mobile-responsive design

## 🚗 Live Demo
- **Development**: https://3000-i51ivr15fg39wpp36e5ub-6532622b.e2b.dev
- **GitHub**: (Ready to be connected - requires GitHub setup)

## 🎯 Key Features

### ✅ Completed Features
- **User Authentication**: Email-based registration and login
- **Private Groups**: Create and join family/friend rideshare groups with invite codes
- **Admin Features**: Group deletion and admin transfer capabilities
- **Driver Management**: Toggle driver status and availability
- **Address-Based Requests**: Request rides using real addresses with geocoding
- **Ride Cancellation**: Cancel ride requests before pickup
- **Smart Matching**: Find closest available drivers in your group
- **Real-time Location**: Location tracking for better matching
- **Ride Organization**: Separate current rides from history with requester info
- **Ride Status Tracking**: Track ride progress from request to completion
- **Responsive UI**: Mobile-friendly interface with TailwindCSS

### 🔄 Core Functionality
1. **Sign up/Login** with email
2. **Create or Join Groups** using 8-character invite codes
3. **Request Rides** within your trusted groups
4. **Accept/Offer Rides** as an available driver
5. **Track Ride Status** in real-time
6. **Location Sharing** for optimal driver matching

### 📋 Features Not Yet Implemented
- **Real map integration** (currently uses placeholder coordinates)
- **Push notifications** (currently in-app notifications only)
- **Ride history and analytics**
- **Payment integration**
- **Advanced route optimization**
- **Driver ratings and reviews**

## 🏗️ Data Architecture

### Database Schema (Cloudflare D1)
- **users**: User profiles, driver status, location data
- **ride_groups**: Family/friend groups with invite codes
- **group_members**: Group membership and admin roles
- **rides**: Ride requests with pickup/destination coordinates
- **ride_offers**: Driver responses to ride requests
- **user_sessions**: Simple token-based authentication

### Storage Services Used
- **Cloudflare D1**: Primary SQLite database for all relational data
- **Local Development**: Uses wrangler's --local flag with SQLite in `.wrangler/state/v3/d1`

### Data Models
```sql
-- Key tables structure
users (id, email, name, phone, is_driver, is_available, last_latitude, last_longitude)
ride_groups (id, name, invite_code, created_by)
rides (id, group_id, requester_id, driver_id, pickup/destination coords, status)
ride_offers (id, ride_id, driver_id, estimated_arrival_minutes)
```

## 📱 User Guide

### Getting Started
1. **Visit the app** and click "Sign Up"
2. **Register** with your email and name
3. **Create a family group** or **join existing** with invite code
4. **Enable driver status** if you want to offer rides
5. **Request rides** when you need transportation

### For Ride Requesters
1. Click "Request Ride" on dashboard
2. Select your group and enter pickup/destination addresses
3. Use "Current Location" button to auto-populate your address
4. Add passenger count and any special notes
5. Wait for drivers in your group to respond
6. Accept an offer and track your ride
7. **Cancel ride** anytime before pickup if plans change

### For Drivers
1. Toggle "I can drive others" in dashboard
2. Set availability status when ready to drive
3. Receive notifications for ride requests in your groups
4. Offer rides with estimated arrival time
5. Update ride status (picked up, completed)

### Group Management
- **Create Group**: Generate unique 8-character invite code
- **Invite Members**: Share invite code with family/friends
- **Admin Controls**: Delete groups or transfer admin rights to other members
- **Multiple Groups**: Join multiple family/friend circles

## 🚀 Deployment

### Current Status
- **Platform**: ✅ Cloudflare Pages (ready for deployment)
- **Local Development**: ✅ Active on PM2 with D1 local database
- **Tech Stack**: Hono + TypeScript + TailwindCSS + Cloudflare D1
- **Last Updated**: August 17, 2025

### Local Development Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:migrate:local
npm run db:seed

# Build and start development server
npm run build
npm run clean-port
pm2 start ecosystem.config.cjs

# Test the application
curl http://localhost:3000
```

### Production Deployment Process
```bash
# Prerequisites: Set up Cloudflare API key first
# 1. Create production D1 database
npx wrangler d1 create webapp-production

# 2. Update wrangler.jsonc with database ID

# 3. Apply migrations to production
npm run db:migrate:prod

# 4. Build and deploy
npm run build
npx wrangler pages deploy dist --project-name family-rideshare

# 5. Set up custom domain (optional)
npx wrangler pages domain add yourdomain.com --project-name family-rideshare
```

## 🛠️ Technical Details

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/location` - Update location
- `POST /api/groups` - Create group
- `POST /api/groups/join` - Join group
- `GET /api/groups` - List user groups
- `POST /api/rides` - Request ride
- `GET /api/rides` - List rides
- `GET /api/rides/:id/available-drivers` - Find drivers
- `POST /api/rides/:id/offer` - Offer ride
- `POST /api/rides/:id/accept-offer/:offerId` - Accept offer
- `PUT /api/rides/:id/status` - Update ride status (including cancellation)
- `DELETE /api/groups/:id` - Delete group (admin only)
- `PUT /api/groups/:id/transfer-admin` - Transfer admin rights

### Distance Calculation Algorithm
```javascript
// Haversine formula for calculating distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  // Mathematical calculation for great-circle distance
}
```

### Authentication System
- **Token-based**: UUID session tokens with 7-day expiration
- **Middleware**: Automatic token validation for protected routes
- **Local Storage**: Client-side token persistence

## 🔧 Development Commands

```bash
# Database management
npm run db:migrate:local     # Apply migrations locally
npm run db:migrate:prod      # Apply migrations to production
npm run db:seed              # Seed test data
npm run db:reset             # Reset local database
npm run db:console:local     # Database console (local)

# Development
npm run build                # Build for production
npm run dev:sandbox          # Development server (sandbox)
npm run clean-port           # Clean port 3000
npm run test                 # Test endpoint

# Deployment
npm run deploy               # Deploy to Cloudflare Pages
npm run deploy:prod          # Deploy to production project
```

## 🌟 Recommended Next Steps

### Immediate Improvements
1. **Map Integration**: Add Google Maps or Mapbox for real locations
2. **Push Notifications**: Implement real-time notifications
3. **Production Deployment**: Set up Cloudflare API key and deploy

### Future Enhancements
1. **Route Optimization**: Calculate optimal pickup routes
2. **Payment System**: Integrate Stripe for ride payments
3. **Rating System**: Add driver and passenger ratings
4. **Ride Analytics**: Dashboard with ride statistics
5. **Emergency Features**: Safety check-ins and emergency contacts
6. **Multi-language Support**: Internationalization
7. **Mobile App**: React Native or PWA version

### Security & Performance
1. **Enhanced Authentication**: Add password/2FA options
2. **Rate Limiting**: Prevent API abuse
3. **Data Encryption**: Encrypt sensitive location data
4. **CDN Optimization**: Optimize static asset delivery
5. **Database Optimization**: Add more indexes and query optimization

This family rideshare app provides a solid foundation for safe, trusted transportation within your personal network. The proximity-based matching ensures you get rides from the closest available family member or friend, just like Uber but with people you trust!