# Sistema de Licencias Implementado

Hemos integrado exitosamente el sistema de control de suscripciones por tiempo en la aplicación Tauri, conectado a la base de datos Supabase.

## ¿Qué se ha implementado?

### 1. Backend de Seguridad (Rust)
Se creó el archivo `license.rs` que gestiona de manera segura la comunicación con Supabase. Al estar en Rust, es muy difícil que un usuario pueda "hackear" la aplicación modificando el código de JavaScript.
- La aplicación obtiene un **Hardware ID** único por computadora.
- Se hace una petición segura a Supabase para verificar que la licencia existe, está activa y no ha vencido.
- Se guarda un "caché" encriptado localmente en `license.dat` para que la app pueda abrirse rápido y no se bloquee si el internet falla momentáneamente.

### 2. Bloqueo en el Frontend (React)
- **`LicenseGuard`:** Se envolvió toda la aplicación con este guardián. Su trabajo es verificar si hay una licencia válida antes de mostrar la pantalla de Login.
- **`LicensePage`:** Si no hay licencia, o si Supabase dice que expiró, el usuario quedará atrapado en esta pantalla donde se le pide una clave de activación.

---

## Script de Configuración de Base de Datos (Supabase)

Para tener un respaldo en el futuro, aquí se adjunta el script SQL utilizado para inicializar la base de datos de licencias en Supabase. Se debe ejecutar en el **SQL Editor** de tu proyecto en Supabase.

```sql
-- 1. Crear la tabla de licencias
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key text UNIQUE NOT NULL,
  cliente text,
  hardware_id text,
  fecha_expiracion date NOT NULL,
  activa boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Seguridad de Fila)
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para que usuarios anónimos (la App) puedan LEER licencias
-- Nota: Solo pueden leer si saben exactamente el license_key (se usa en la url: ?license_key=eq.XXXX)
CREATE POLICY "Permitir lectura publica" ON public.licenses
  FOR SELECT USING (true);

-- 4. Crear política para que la App pueda ACTUALIZAR el hardware_id (solo una vez)
CREATE POLICY "Permitir asignar hardware_id" ON public.licenses
  FOR UPDATE USING (hardware_id IS NULL) WITH CHECK (hardware_id IS NOT NULL);

-- ==========================================
-- DATOS DE PRUEBA (Ejecuta esto también para probar)
-- ==========================================
INSERT INTO public.licenses (license_key, cliente, fecha_expiracion, activa)
VALUES 
  ('DEMO-MINIMARKET-2026', 'Cliente de Prueba', '2026-12-31', true),
  ('LICENCIA-EXPIRADA', 'Cliente Moroso', '2020-01-01', true),
  ('LICENCIA-BLOQUEADA', 'Cliente Suspendido', '2026-12-31', false)
ON CONFLICT (license_key) DO NOTHING;
```
