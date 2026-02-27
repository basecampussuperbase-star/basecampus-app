-- Bloque anónimo para manejo de errores y lógica condicional
DO $$
BEGIN
    -- 1. Crear columnas si no existen (Ya verificamos que existen, pero por seguridad)
    BEGIN
        ALTER TABLE courses ADD COLUMN meeting_platform text CHECK (meeting_platform IN ('zoom', 'meet', 'tea'));
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE courses ADD COLUMN image_url text;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 2. Insertar bucket 'covers' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Eliminar políticas antiguas para evitar conflictos (Recreación limpia)
DROP POLICY IF EXISTS "Cover images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload covers." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update/delete covers." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete covers." ON storage.objects;

-- 4. Crear nuevas políticas
-- Permiso de lectura pública
CREATE POLICY "Cover images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'covers' );

-- Permiso de subida (solo usuarios autenticados)
CREATE POLICY "Authenticated users can upload covers."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'covers' AND auth.role() = 'authenticated' );

-- Permiso de actualización (solo usuarios autenticados)
CREATE POLICY "Authenticated users can update covers."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'covers' AND auth.role() = 'authenticated' );

-- Permiso de borrado (solo usuarios autenticados)
CREATE POLICY "Authenticated users can delete covers."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'covers' AND auth.role() = 'authenticated' );
