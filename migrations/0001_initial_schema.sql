-- Users table - stores family members and friends
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  profile_picture TEXT,
  is_driver BOOLEAN DEFAULT 0,
  is_available BOOLEAN DEFAULT 0,
  last_latitude REAL,
  last_longitude REAL,
  last_location_update DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Family/Friend Groups table
CREATE TABLE IF NOT EXISTS ride_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Group memberships
CREATE TABLE IF NOT EXISTS group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  is_admin BOOLEAN DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES ride_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

-- Ride requests
CREATE TABLE IF NOT EXISTS rides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  requester_id INTEGER NOT NULL,
  driver_id INTEGER,
  pickup_latitude REAL NOT NULL,
  pickup_longitude REAL NOT NULL,
  pickup_address TEXT,
  destination_latitude REAL NOT NULL,
  destination_longitude REAL NOT NULL,
  destination_address TEXT,
  passenger_count INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'picked_up', 'completed', 'cancelled')),
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  pickup_time DATETIME,
  completed_at DATETIME,
  FOREIGN KEY (group_id) REFERENCES ride_groups(id),
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- Ride offers/responses from drivers
CREATE TABLE IF NOT EXISTS ride_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ride_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  estimated_arrival_minutes INTEGER,
  message TEXT,
  offered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- User sessions for simple auth
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(last_latitude, last_longitude);
CREATE INDEX IF NOT EXISTS idx_users_available ON users(is_available, is_driver);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_group ON rides(group_id);
CREATE INDEX IF NOT EXISTS idx_rides_requester ON rides(requester_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride ON ride_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver ON ride_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_groups_invite ON ride_groups(invite_code);