-- Identify and delete duplicate rooms, keeping the one with the most recent created_at or id
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC, id DESC) AS row_num
  FROM rooms
)
DELETE FROM rooms
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Verify distinct rooms
SELECT name, capacity FROM rooms;
