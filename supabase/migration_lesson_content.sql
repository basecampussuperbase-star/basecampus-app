-- Add specialized columns for Lesson Content
alter table lessons 
add column pdf_url text, -- To store PDF link
add column resources jsonb default '[]'::jsonb, -- To store array of buttons/links: [{ "label": "Descargar", "url": "..." }]
add column video_duration integer; -- Optional: Duration in seconds
