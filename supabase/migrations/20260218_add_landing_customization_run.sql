-- Add customization columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '["Acceso inmediato al contenido", "Certificado de finalización"]'::jsonb;
