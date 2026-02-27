-- Make room_id nullable to support Online sessions (which don't have a room)
ALTER TABLE bookings ALTER COLUMN room_id DROP NOT NULL;
