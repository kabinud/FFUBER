import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { jsxRenderer } from 'hono/jsx-renderer'

// Define CloudflareBindings interface
type CloudflareBindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// JSX renderer for the main page
app.use(jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FamRide - Safe rides with people you trust</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50 font-sans">
        {children}
        <script src="/static/test.js"></script>
        <script src="/static/features.js"></script>
        <script src="/static/auth.js"></script>
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
}))

// Utility functions
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateSessionToken(): string {
  return crypto.randomUUID()
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in kilometers
}

// Authentication middleware
async function authenticateUser(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization token required' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { env } = c
  
  const session = await env.DB.prepare(`
    SELECT us.user_id, u.email, u.name 
    FROM user_sessions us 
    JOIN users u ON us.user_id = u.id 
    WHERE us.session_token = ? AND us.expires_at > datetime('now')
  `).bind(token).first()

  if (!session) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('user', session)
  await next()
}

// API Routes

// Authentication
app.post('/api/auth/register', async (c) => {
  const { env } = c
  const { email, name, phone } = await c.req.json()

  if (!email || !name) {
    return c.json({ error: 'Email and name are required' }, 400)
  }

  try {
    // Check if user already exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email).first()
    
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409)
    }

    // Create user
    const result = await env.DB.prepare(`
      INSERT INTO users (email, name, phone) 
      VALUES (?, ?, ?) 
      RETURNING id, email, name, phone, is_driver, is_available
    `).bind(email, name, phone).first()

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, expires_at) 
      VALUES (?, ?, ?)
    `).bind(result.id, sessionToken, expiresAt).run()

    return c.json({ 
      user: result, 
      token: sessionToken,
      expiresAt 
    })
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  const { env } = c
  const { email } = await c.req.json()

  if (!email) {
    return c.json({ error: 'Email is required' }, 400)
  }

  try {
    // Find user
    const user = await env.DB.prepare(`
      SELECT id, email, name, phone, is_driver, is_available 
      FROM users WHERE email = ?
    `).bind(email).first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, expires_at) 
      VALUES (?, ?, ?)
    `).bind(user.id, sessionToken, expiresAt).run()

    return c.json({ 
      user, 
      token: sessionToken,
      expiresAt 
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// User management
app.get('/api/user/profile', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c

  const profile = await env.DB.prepare(`
    SELECT id, email, name, phone, is_driver, is_available, 
           last_latitude, last_longitude, last_location_update
    FROM users WHERE id = ?
  `).bind(user.user_id).first()

  return c.json({ user: profile })
})

app.put('/api/user/profile', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c
  const { name, phone, is_driver } = await c.req.json()

  try {
    await env.DB.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, is_driver = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(name, phone, is_driver ? 1 : 0, user.user_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Update failed' }, 500)
  }
})

app.post('/api/user/location', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c
  const { latitude, longitude, is_available } = await c.req.json()

  if (!latitude || !longitude) {
    return c.json({ error: 'Latitude and longitude required' }, 400)
  }

  try {
    await env.DB.prepare(`
      UPDATE users 
      SET last_latitude = ?, last_longitude = ?, is_available = ?, 
          last_location_update = datetime('now')
      WHERE id = ?
    `).bind(latitude, longitude, is_available ? 1 : 0, user.user_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Location update failed' }, 500)
  }
})

// Group management
app.post('/api/groups', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c
  const { name, description } = await c.req.json()

  if (!name) {
    return c.json({ error: 'Group name is required' }, 400)
  }

  try {
    const inviteCode = generateInviteCode()
    
    const group = await env.DB.prepare(`
      INSERT INTO ride_groups (name, description, invite_code, created_by) 
      VALUES (?, ?, ?, ?) 
      RETURNING id, name, description, invite_code
    `).bind(name, description, inviteCode, user.user_id).first()

    // Add creator as admin
    await env.DB.prepare(`
      INSERT INTO group_members (group_id, user_id, is_admin) 
      VALUES (?, ?, 1)
    `).bind(group.id, user.user_id).run()

    return c.json({ group })
  } catch (error) {
    return c.json({ error: 'Failed to create group' }, 500)
  }
})

app.post('/api/groups/join', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c
  const { invite_code } = await c.req.json()

  if (!invite_code) {
    return c.json({ error: 'Invite code is required' }, 400)
  }

  try {
    // Find group
    const group = await env.DB.prepare(`
      SELECT id, name FROM ride_groups WHERE invite_code = ?
    `).bind(invite_code).first()

    if (!group) {
      return c.json({ error: 'Invalid invite code' }, 404)
    }

    // Check if already member
    const existing = await env.DB.prepare(`
      SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(group.id, user.user_id).first()

    if (existing) {
      return c.json({ error: 'Already a member of this group' }, 409)
    }

    // Add to group
    await env.DB.prepare(`
      INSERT INTO group_members (group_id, user_id, is_admin) 
      VALUES (?, ?, 0)
    `).bind(group.id, user.user_id).run()

    return c.json({ success: true, group })
  } catch (error) {
    return c.json({ error: 'Failed to join group' }, 500)
  }
})

app.get('/api/groups', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c

  const groupsResult = await env.DB.prepare(`
    SELECT rg.id, rg.name, rg.description, rg.invite_code, 
           gm.is_admin, rg.created_at,
           COUNT(gm2.user_id) as member_count
    FROM ride_groups rg
    JOIN group_members gm ON rg.id = gm.group_id
    LEFT JOIN group_members gm2 ON rg.id = gm2.group_id
    WHERE gm.user_id = ?
    GROUP BY rg.id, rg.name, rg.description, rg.invite_code, gm.is_admin, rg.created_at
  `).bind(user.user_id).all()

  return c.json({ groups: groupsResult.results || [] })
})

app.get('/api/groups/:id/members', authenticateUser, async (c) => {
  const groupId = c.req.param('id')
  const user = c.get('user')
  const { env } = c

  // Check if user is member of group
  const membership = await env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.user_id).first()

  if (!membership) {
    return c.json({ error: 'Not authorized to view this group' }, 403)
  }

  const membersResult = await env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.is_driver, u.is_available, 
           gm.is_admin, gm.joined_at,
           u.last_latitude, u.last_longitude, u.last_location_update
    FROM users u
    JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.is_admin DESC, u.name
  `).bind(groupId).all()

  return c.json({ members: membersResult.results || [] })
})

// Delete group (admin only)
app.delete('/api/groups/:id', authenticateUser, async (c) => {
  const groupId = c.req.param('id')
  const user = c.get('user')
  const { env } = c

  try {
    // Verify user is admin of this group
    const adminCheck = await env.DB.prepare(`
      SELECT id FROM group_members 
      WHERE group_id = ? AND user_id = ? AND is_admin = 1
    `).bind(groupId, user.user_id).first()

    if (!adminCheck) {
      return c.json({ error: 'Only group admins can delete groups' }, 403)
    }

    // Delete all group members first
    await env.DB.prepare(`
      DELETE FROM group_members WHERE group_id = ?
    `).bind(groupId).run()

    // Delete all rides associated with this group
    await env.DB.prepare(`
      DELETE FROM rides WHERE group_id = ?
    `).bind(groupId).run()

    // Delete the group
    await env.DB.prepare(`
      DELETE FROM ride_groups WHERE id = ?
    `).bind(groupId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete group' }, 500)
  }
})

// Transfer admin rights (admin only)
app.put('/api/groups/:id/transfer-admin', authenticateUser, async (c) => {
  const groupId = c.req.param('id')
  const user = c.get('user')
  const { env } = c
  const { new_admin_id } = await c.req.json()

  if (!new_admin_id) {
    return c.json({ error: 'New admin user ID is required' }, 400)
  }

  try {
    // Verify current user is admin of this group
    const adminCheck = await env.DB.prepare(`
      SELECT id FROM group_members 
      WHERE group_id = ? AND user_id = ? AND is_admin = 1
    `).bind(groupId, user.user_id).first()

    if (!adminCheck) {
      return c.json({ error: 'Only group admins can transfer admin rights' }, 403)
    }

    // Verify new admin is a member of this group
    const newAdminCheck = await env.DB.prepare(`
      SELECT id FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, new_admin_id).first()

    if (!newAdminCheck) {
      return c.json({ error: 'New admin must be a member of this group' }, 400)
    }

    // Remove admin rights from current admin
    await env.DB.prepare(`
      UPDATE group_members 
      SET is_admin = 0 
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, user.user_id).run()

    // Grant admin rights to new admin
    await env.DB.prepare(`
      UPDATE group_members 
      SET is_admin = 1 
      WHERE group_id = ? AND user_id = ?
    `).bind(groupId, new_admin_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to transfer admin rights' }, 500)
  }
})

// Ride requests and management
app.post('/api/rides', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c
  const { 
    group_id, pickup_latitude, pickup_longitude, pickup_address,
    destination_latitude, destination_longitude, destination_address,
    passenger_count, notes 
  } = await c.req.json()

  if (!group_id || !pickup_latitude || !pickup_longitude || !destination_latitude || !destination_longitude) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  try {
    // Verify user is member of group
    const membership = await env.DB.prepare(`
      SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
    `).bind(group_id, user.user_id).first()

    if (!membership) {
      return c.json({ error: 'Not authorized for this group' }, 403)
    }

    const ride = await env.DB.prepare(`
      INSERT INTO rides (
        group_id, requester_id, pickup_latitude, pickup_longitude, pickup_address,
        destination_latitude, destination_longitude, destination_address,
        passenger_count, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, group_id, requester_id, pickup_latitude, pickup_longitude,
                pickup_address, destination_latitude, destination_longitude,
                destination_address, passenger_count, notes, status, requested_at
    `).bind(
      group_id, user.user_id, pickup_latitude, pickup_longitude, pickup_address,
      destination_latitude, destination_longitude, destination_address,
      passenger_count || 1, notes
    ).first()

    return c.json({ ride })
  } catch (error) {
    console.error('Create ride error:', error)
    return c.json({ error: 'Failed to create ride request' }, 500)
  }
})

// Update ride request (only for 'requested' status)
app.put('/api/rides/:id', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const user = c.get('user')
  const { env } = c
  const { 
    pickup_latitude, pickup_longitude, pickup_address,
    destination_latitude, destination_longitude, destination_address,
    passenger_count, notes 
  } = await c.req.json()

  if (!pickup_latitude || !pickup_longitude || !destination_latitude || !destination_longitude) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  try {
    // Verify ride exists, user is requester, and status is 'requested'
    const ride = await env.DB.prepare(`
      SELECT requester_id, status FROM rides WHERE id = ?
    `).bind(rideId).first()

    if (!ride) {
      return c.json({ error: 'Ride not found' }, 404)
    }

    if (ride.requester_id !== user.user_id) {
      return c.json({ error: 'Only the ride requester can edit this ride' }, 403)
    }

    if (ride.status !== 'requested') {
      return c.json({ error: 'Can only edit rides that are still pending (requested status)' }, 400)
    }

    // Update the ride
    const updatedRide = await env.DB.prepare(`
      UPDATE rides SET 
        pickup_latitude = ?, pickup_longitude = ?, pickup_address = ?,
        destination_latitude = ?, destination_longitude = ?, destination_address = ?,
        passenger_count = ?, notes = ?
      WHERE id = ?
      RETURNING id, group_id, requester_id, pickup_latitude, pickup_longitude,
                pickup_address, destination_latitude, destination_longitude,
                destination_address, passenger_count, notes, status, requested_at
    `).bind(
      pickup_latitude, pickup_longitude, pickup_address,
      destination_latitude, destination_longitude, destination_address,
      passenger_count || 1, notes, rideId
    ).first()

    return c.json({ ride: updatedRide })
  } catch (error) {
    console.error('Update ride error:', error)
    return c.json({ error: 'Failed to update ride request' }, 500)
  }
})

app.get('/api/rides', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c
  const status = c.req.query('status') || 'all'
  const group_id = c.req.query('group_id')

  let query = `
    SELECT r.*, u.name as requester_name, u2.name as driver_name, rg.name as group_name
    FROM rides r
    JOIN users u ON r.requester_id = u.id
    LEFT JOIN users u2 ON r.driver_id = u2.id
    JOIN ride_groups rg ON r.group_id = rg.id
    JOIN group_members gm ON rg.id = gm.group_id
    WHERE gm.user_id = ?
  `
  
  const params = [user.user_id]
  
  if (status !== 'all') {
    query += ' AND r.status = ?'
    params.push(status)
  }
  
  if (group_id) {
    query += ' AND r.group_id = ?'
    params.push(group_id)
  }
  
  query += ' ORDER BY r.requested_at DESC'

  const ridesResult = await env.DB.prepare(query).bind(...params).all()
  return c.json({ rides: ridesResult.results || [] })
})

// Get ride history (completed and cancelled rides)
app.get('/api/rides/history', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  try {
    const historyQuery = `
      SELECT r.*, u.name as requester_name, u2.name as driver_name, rg.name as group_name
      FROM rides r
      JOIN users u ON r.requester_id = u.id
      LEFT JOIN users u2 ON r.driver_id = u2.id
      JOIN ride_groups rg ON r.group_id = rg.id
      JOIN group_members gm ON rg.id = gm.group_id
      WHERE gm.user_id = ? AND r.status IN ('completed', 'cancelled')
      ORDER BY r.requested_at DESC
      LIMIT ? OFFSET ?
    `
    
    const ridesResult = await env.DB.prepare(historyQuery).bind(user.user_id, limit, offset).all()
    
    // Get total count for pagination
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM rides r
      JOIN ride_groups rg ON r.group_id = rg.id
      JOIN group_members gm ON rg.id = gm.group_id
      WHERE gm.user_id = ? AND r.status IN ('completed', 'cancelled')
    `).bind(user.user_id).first()
    
    return c.json({ 
      rides: ridesResult.results || [], 
      total: countResult?.total || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Get ride history error:', error)
    return c.json({ error: 'Failed to get ride history' }, 500)
  }
})

// Duplicate a historical ride request
app.post('/api/rides/:id/duplicate', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const user = c.get('user')
  const { env } = c

  try {
    // Get the original ride
    const originalRide = await env.DB.prepare(`
      SELECT r.*, gm.user_id as member_check
      FROM rides r
      JOIN group_members gm ON r.group_id = gm.group_id
      WHERE r.id = ? AND r.requester_id = ? AND gm.user_id = ? AND r.status IN ('completed', 'cancelled')
    `).bind(rideId, user.user_id, user.user_id).first()

    if (!originalRide) {
      return c.json({ error: 'Original ride not found or you cannot duplicate this ride' }, 404)
    }

    // Create new ride request with same details
    const newRide = await env.DB.prepare(`
      INSERT INTO rides (
        group_id, requester_id, pickup_latitude, pickup_longitude, pickup_address,
        destination_latitude, destination_longitude, destination_address,
        passenger_count, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, group_id, requester_id, pickup_latitude, pickup_longitude,
                pickup_address, destination_latitude, destination_longitude,
                destination_address, passenger_count, notes, status, requested_at
    `).bind(
      originalRide.group_id, user.user_id, 
      originalRide.pickup_latitude, originalRide.pickup_longitude, originalRide.pickup_address,
      originalRide.destination_latitude, originalRide.destination_longitude, originalRide.destination_address,
      originalRide.passenger_count, originalRide.notes
    ).first()

    return c.json({ ride: newRide })
  } catch (error) {
    console.error('Duplicate ride error:', error)
    return c.json({ error: 'Failed to duplicate ride request' }, 500)
  }
})

// Find available drivers near pickup location
app.get('/api/rides/:id/available-drivers', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const user = c.get('user')
  const { env } = c

  try {
    // Get ride details and verify access
    const ride = await env.DB.prepare(`
      SELECT r.*, gm.user_id as member_check
      FROM rides r
      JOIN group_members gm ON r.group_id = gm.group_id
      WHERE r.id = ? AND gm.user_id = ?
    `).bind(rideId, user.user_id).first()

    if (!ride) {
      return c.json({ error: 'Ride not found or no access' }, 404)
    }

    // Get available drivers in the same group with location data
    const driversResult = await env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.last_latitude, u.last_longitude,
             u.last_location_update
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ? AND u.is_driver = 1 AND u.is_available = 1 
        AND u.last_latitude IS NOT NULL AND u.last_longitude IS NOT NULL
        AND u.id != ?
      ORDER BY u.last_location_update DESC
    `).bind(ride.group_id, ride.requester_id).all()
    
    const drivers = driversResult.results || []

    // Calculate distances and sort by proximity
    const driversWithDistance = drivers.map(driver => ({
      ...driver,
      distance: calculateDistance(
        ride.pickup_latitude, 
        ride.pickup_longitude,
        driver.last_latitude,
        driver.last_longitude
      ),
      estimatedArrival: Math.ceil(
        calculateDistance(
          ride.pickup_latitude, 
          ride.pickup_longitude,
          driver.last_latitude,
          driver.last_longitude
        ) * 2 // Rough estimate: 2 minutes per km
      )
    })).sort((a, b) => a.distance - b.distance)

    return c.json({ drivers: driversWithDistance })
  } catch (error) {
    return c.json({ error: 'Failed to get available drivers' }, 500)
  }
})

// Driver offer to take ride
app.post('/api/rides/:id/offer', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const user = c.get('user')
  const { env } = c
  const { estimated_arrival_minutes, message } = await c.req.json()

  try {
    // Verify the ride exists and user has access
    const ride = await env.DB.prepare(`
      SELECT r.*, gm.user_id as member_check
      FROM rides r
      JOIN group_members gm ON r.group_id = gm.group_id
      WHERE r.id = ? AND gm.user_id = ? AND r.status = 'requested'
    `).bind(rideId, user.user_id).first()

    if (!ride) {
      return c.json({ error: 'Ride not found or already taken' }, 404)
    }

    // Check if driver already made an offer
    const existingOffer = await env.DB.prepare(`
      SELECT id FROM ride_offers WHERE ride_id = ? AND driver_id = ?
    `).bind(rideId, user.user_id).first()

    if (existingOffer) {
      return c.json({ error: 'You have already made an offer for this ride' }, 409)
    }

    // Create offer
    const offer = await env.DB.prepare(`
      INSERT INTO ride_offers (ride_id, driver_id, estimated_arrival_minutes, message)
      VALUES (?, ?, ?, ?)
      RETURNING id, ride_id, driver_id, estimated_arrival_minutes, message, offered_at
    `).bind(rideId, user.user_id, estimated_arrival_minutes, message).first()

    return c.json({ offer })
  } catch (error) {
    return c.json({ error: 'Failed to create offer' }, 500)
  }
})

// Accept driver offer (by ride requester)
app.post('/api/rides/:id/accept-offer/:offerId', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const offerId = c.req.param('offerId')
  const user = c.get('user')
  const { env } = c

  try {
    // Verify ride and offer
    const rideOffer = await env.DB.prepare(`
      SELECT r.requester_id, ro.driver_id, r.status
      FROM rides r
      JOIN ride_offers ro ON r.id = ro.ride_id
      WHERE r.id = ? AND ro.id = ? AND r.requester_id = ?
    `).bind(rideId, offerId, user.user_id).first()

    if (!rideOffer || rideOffer.status !== 'requested') {
      return c.json({ error: 'Ride or offer not found' }, 404)
    }

    // Accept the ride
    await env.DB.prepare(`
      UPDATE rides 
      SET driver_id = ?, status = 'accepted', accepted_at = datetime('now')
      WHERE id = ?
    `).bind(rideOffer.driver_id, rideId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to accept offer' }, 500)
  }
})

// Get available ride requests for drivers
app.get('/api/rides/available', authenticateUser, async (c) => {
  const user = c.get('user')
  const { env } = c

  try {
    // Get available rides (requested) and accepted rides by this driver
    const availableRides = await env.DB.prepare(`
      SELECT r.*, u.name as requester_name, u2.name as driver_name, rg.name as group_name,
             ROUND(
               3959 * acos(
                 cos(radians(?)) * cos(radians(r.pickup_latitude)) *
                 cos(radians(r.pickup_longitude) - radians(?)) +
                 sin(radians(?)) * sin(radians(r.pickup_latitude))
               ) * 10
             ) / 10 as distance_miles
      FROM rides r
      JOIN users u ON r.requester_id = u.id
      LEFT JOIN users u2 ON r.driver_id = u2.id
      JOIN ride_groups rg ON r.group_id = rg.id
      JOIN group_members gm ON rg.id = gm.group_id
      LEFT JOIN users driver_user ON gm.user_id = driver_user.id
      WHERE gm.user_id = ? 
        AND r.requester_id != ?
        AND (
          (r.status = 'requested' AND driver_user.is_driver = 1 AND driver_user.is_available = 1)
          OR 
          (r.status = 'accepted' AND r.driver_id = ?)
        )
      ORDER BY 
        CASE WHEN r.driver_id = ? THEN 0 ELSE 1 END,
        distance_miles ASC
    `).bind(
      user.last_latitude || 0, 
      user.last_longitude || 0,
      user.last_latitude || 0,
      user.user_id,
      user.user_id,
      user.user_id,
      user.user_id
    ).all()

    return c.json({ rides: availableRides.results || [] })
  } catch (error) {
    console.error('Get available rides error:', error)
    return c.json({ error: 'Failed to get available rides' }, 500)
  }
})

// Driver directly accepts a ride request
app.post('/api/rides/:id/accept', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const user = c.get('user')
  const { env } = c

  try {
    // Verify user is a driver and available
    const driverCheck = await env.DB.prepare(`
      SELECT is_driver, is_available FROM users WHERE id = ?
    `).bind(user.user_id).first()

    if (!driverCheck?.is_driver) {
      return c.json({ error: 'Only drivers can accept rides' }, 403)
    }

    if (!driverCheck?.is_available) {
      return c.json({ error: 'You must be available to accept rides' }, 400)
    }

    // Verify ride exists, is in requested status, and user has access
    const ride = await env.DB.prepare(`
      SELECT r.*, gm.user_id as member_check
      FROM rides r
      JOIN group_members gm ON r.group_id = gm.group_id
      WHERE r.id = ? AND gm.user_id = ? AND r.status = 'requested' AND r.requester_id != ?
    `).bind(rideId, user.user_id, user.user_id).first()

    if (!ride) {
      return c.json({ error: 'Ride not found, already taken, or you cannot accept your own ride' }, 404)
    }

    // Accept the ride (this locks it to this driver)
    await env.DB.prepare(`
      UPDATE rides 
      SET driver_id = ?, status = 'accepted', accepted_at = datetime('now')
      WHERE id = ? AND status = 'requested'
    `).bind(user.user_id, rideId).run()

    // Verify the update was successful (in case of race condition)
    const updatedRide = await env.DB.prepare(`
      SELECT driver_id FROM rides WHERE id = ?
    `).bind(rideId).first()

    if (updatedRide?.driver_id !== user.user_id) {
      return c.json({ error: 'Ride was accepted by another driver' }, 409)
    }

    return c.json({ success: true, message: 'Ride request accepted successfully' })
  } catch (error) {
    console.error('Accept ride error:', error)
    return c.json({ error: 'Failed to accept ride request' }, 500)
  }
})

// Driver cancels/de-accepts an accepted ride
app.post('/api/rides/:id/deaccept', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const user = c.get('user')
  const { env } = c

  try {
    // Verify ride exists and user is the assigned driver
    const ride = await env.DB.prepare(`
      SELECT driver_id, status FROM rides WHERE id = ?
    `).bind(rideId).first()

    if (!ride) {
      return c.json({ error: 'Ride not found' }, 404)
    }

    if (ride.driver_id !== user.user_id) {
      return c.json({ error: 'You can only cancel rides you have accepted' }, 403)
    }

    if (ride.status !== 'accepted') {
      return c.json({ error: 'Can only cancel accepted rides (not picked up or completed)' }, 400)
    }

    // Return ride to requested status
    await env.DB.prepare(`
      UPDATE rides 
      SET driver_id = NULL, status = 'requested', accepted_at = NULL
      WHERE id = ?
    `).bind(rideId).run()

    return c.json({ success: true, message: 'Ride acceptance cancelled - request is now available for other drivers' })
  } catch (error) {
    console.error('Deaccept ride error:', error)
    return c.json({ error: 'Failed to cancel ride acceptance' }, 500)
  }
})

// Update ride status
app.put('/api/rides/:id/status', authenticateUser, async (c) => {
  const rideId = c.req.param('id')
  const user = c.get('user')
  const { env } = c
  const { status } = await c.req.json()

  const validStatuses = ['picked_up', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  try {
    // Verify user is either driver or requester
    const ride = await env.DB.prepare(`
      SELECT requester_id, driver_id, status as current_status FROM rides WHERE id = ?
    `).bind(rideId).first()

    if (!ride || (ride.requester_id !== user.user_id && ride.driver_id !== user.user_id)) {
      return c.json({ error: 'Not authorized to update this ride' }, 403)
    }

    // Special rules for cancellation
    if (status === 'cancelled') {
      // Only requester can cancel, and only if ride is still 'requested' or 'accepted'
      if (ride.requester_id !== user.user_id) {
        return c.json({ error: 'Only the ride requester can cancel a ride' }, 403)
      }
      if (!['requested', 'accepted'].includes(ride.current_status)) {
        return c.json({ error: 'Cannot cancel ride that is already picked up or completed' }, 400)
      }
    }

    let updateField = ''
    if (status === 'picked_up') updateField = 'pickup_time'
    else if (status === 'completed') updateField = 'completed_at'

    const query = updateField 
      ? `UPDATE rides SET status = ?, ${updateField} = datetime('now') WHERE id = ?`
      : `UPDATE rides SET status = ? WHERE id = ?`

    await env.DB.prepare(query).bind(status, rideId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update ride status' }, 500)
  }
})

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FamRide - Safe rides with people you trust</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 font-sans">
    <div>
      <nav class="bg-blue-600 text-white p-4">
        <div class="container mx-auto flex justify-between items-center">
          <h1 class="text-2xl font-bold">
            <i class="fas fa-users mr-2"></i>
            FamRide
          </h1>
          <div id="nav-buttons">
            <button id="login-btn" class="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded mr-2" onclick="alert('Login clicked'); document.getElementById('login-modal').classList.remove('hidden')">
              Login
            </button>
            <button id="register-btn" class="bg-green-500 hover:bg-green-700 px-4 py-2 rounded mr-2" onclick="alert('Register clicked'); document.getElementById('register-modal').classList.remove('hidden')">
              Sign Up
            </button>
            <button onclick="testShowDashboard()" class="bg-yellow-500 hover:bg-yellow-700 px-4 py-2 rounded text-sm">
              Test Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main class="container mx-auto px-4 py-8">
        <div id="landing-page" class="text-center">
          <div class="max-w-2xl mx-auto">
            <h2 class="text-4xl font-bold text-gray-800 mb-6">
              Safe rides with people you trust
            </h2>
            <p class="text-xl text-gray-600 mb-8">
              Create private rideshare groups with your family and friends. 
              Get a ride when you need it from people you know and trust.
            </p>
            
            <div class="grid md:grid-cols-3 gap-6 mb-8">
              <div class="bg-white p-6 rounded-lg shadow-lg">
                <i class="fas fa-shield-alt text-3xl text-blue-600 mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">Safe & Trusted</h3>
                <p class="text-gray-600">Only ride with family and friends you know</p>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-lg">
                <i class="fas fa-map-marker-alt text-3xl text-green-600 mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">Smart Matching</h3>
                <p class="text-gray-600">Automatically finds the closest available driver</p>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-lg">
                <i class="fas fa-mobile-alt text-3xl text-purple-600 mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">Easy to Use</h3>
                <p class="text-gray-600">Simple interface, quick ride requests</p>
              </div>
            </div>

            <button id="get-started-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold" onclick="alert('Get Started clicked'); document.getElementById('register-modal').classList.remove('hidden')">
              Get Started
            </button>
          </div>
        </div>

        <div id="app-content" class="hidden">
          <div class="grid md:grid-cols-3 gap-6">
            <div class="md:col-span-2">
              <div id="main-content">
                {/* Dynamic content will be loaded here */}
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6">
              <div id="sidebar-content">
                {/* Sidebar content */}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      <div id="login-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-2xl font-bold mb-6">Login</h3>
          <form id="login-form" onsubmit="return handleLoginSubmit(event)">
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">Email</label>
              <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex gap-4">
              <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                Login
              </button>
              <button type="button" id="cancel-login" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md" onclick="document.getElementById('login-modal').classList.add('hidden')">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Register Modal */}
      <div id="register-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-2xl font-bold mb-6">Sign Up</h3>
          <form id="register-form" onsubmit="return handleRegisterSubmit(event)">
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">Email</label>
              <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">Full Name</label>
              <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">Phone (optional)</label>
              <input type="tel" name="phone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex gap-4">
              <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
                Sign Up
              </button>
              <button type="button" id="cancel-register" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md" onclick="document.getElementById('register-modal').classList.add('hidden')">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <script src="/static/logger.js"></script>
    <script src="/static/api-client.js"></script>
    <script src="/static/ride-utils.js"></script>
    <script src="/static/timeout-manager.js"></script>
    <script src="/static/features.js"></script>
    <script src="/static/auth.js"></script>
    <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app