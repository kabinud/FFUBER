-- Seed data for family rideshare app

-- Insert test users (family members and friends)
INSERT OR IGNORE INTO users (id, email, name, phone, is_driver, is_available, last_latitude, last_longitude) VALUES 
  (1, 'mom@family.com', 'Mom Johnson', '+1234567890', 1, 1, 40.7128, -74.0060),
  (2, 'dad@family.com', 'Dad Johnson', '+1234567891', 1, 0, 40.7580, -73.9855),
  (3, 'sister@family.com', 'Sarah Johnson', '+1234567892', 1, 1, 40.7614, -73.9776),
  (4, 'brother@family.com', 'Mike Johnson', '+1234567893', 0, 0, 40.7505, -73.9934),
  (5, 'uncle@family.com', 'Uncle Bob', '+1234567894', 1, 1, 40.7282, -74.0776),
  (6, 'friend1@example.com', 'Best Friend Alex', '+1234567895', 1, 0, 40.7489, -73.9680);

-- Insert family group
INSERT OR IGNORE INTO ride_groups (id, name, description, invite_code, created_by) VALUES 
  (1, 'Johnson Family', 'Our family rideshare group', 'JOHNSON2024', 1),
  (2, 'Friends Circle', 'Close friends who help each other out', 'FRIENDS123', 6);

-- Add members to groups
INSERT OR IGNORE INTO group_members (group_id, user_id, is_admin) VALUES 
  (1, 1, 1), -- Mom is admin
  (1, 2, 1), -- Dad is admin
  (1, 3, 0), -- Sarah
  (1, 4, 0), -- Mike
  (1, 5, 0), -- Uncle Bob
  (2, 3, 1), -- Sarah in friends group
  (2, 4, 0), -- Mike in friends group
  (2, 6, 1); -- Alex is admin of friends group

-- Insert some example rides
INSERT OR IGNORE INTO rides (group_id, requester_id, pickup_latitude, pickup_longitude, pickup_address, destination_latitude, destination_longitude, destination_address, passenger_count, notes, status) VALUES 
  (1, 4, 40.7505, -73.9934, '123 Main St, Manhattan', 40.7128, -74.0060, 'Downtown Office Building', 1, 'Need a ride to work, running late!', 'requested'),
  (1, 3, 40.7614, -73.9776, 'Central Park West', 40.7282, -74.0776, 'Brooklyn Mall', 2, 'Shopping trip with friend', 'completed');

-- Insert ride offers
INSERT OR IGNORE INTO ride_offers (ride_id, driver_id, estimated_arrival_minutes, message) VALUES 
  (1, 1, 8, 'I can pick you up in 8 minutes!'),
  (1, 5, 12, 'I am nearby, can be there in 12 min');