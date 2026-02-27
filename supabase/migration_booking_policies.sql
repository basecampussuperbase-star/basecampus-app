-- Add policies for Update and Delete on bookings table

create policy "Users can update their own bookings" on bookings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bookings" on bookings
  for delete using (auth.uid() = user_id);
