# Guía: Actualizaciones Automáticas con Tauri en Repositorios Paralelos de GitHub

## 1. El Contexto y El Problema
Por defecto, el sistema de Auto-Update de Tauri está diseñado para buscar y descargar las actualizaciones públicas alojadas en los **GitHub Releases** de un repositorio. Sin embargo, si tu repositorio principal es **privado**, los clientes no pueden descargar las actualizaciones sin estar autenticados.

**La Solución:** Para mantener el código fuente privado pero ofrecer descargas 100% gratuitas con ancho de banda ilimitado, usamos un repositorio paralelo. 
- Repositorio Privado: `MiniMarket-APP` (Código fuente y scripts).
- Repositorio Público: `MiniMarket-APP-Releases` (Vacío, solo usado para adjuntar los `.exe` en los "Releases").

---

## 2. Generación de Claves Criptográficas (Updater Keys)
Ejecutamos en la terminal del repositorio privado:

```bash
npm run tauri -- signer generate
```

- **Private Key**: `dW50cnVzdGVk...` *(Mantenida en secreto)*
- **Public Key**: `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlBMTQxNDJCRTI3MTMzOEIKUldTTE0zSGlLeFFVbXZmS0w0c1F5K0UxekhvU0ZIVWZZZlViUkdzRllFcW1nZGpod3lCYzZObDYK`

---

## 3. Configuración en la App

### `tauri.conf.json`
Se configuró el endpoint para consultar el `latest.json` en el repositorio **público**:
```json
"updater": {
  "pubkey": "dW50cnVzdGVk...",
  "endpoints": [
    "https://github.com/DennisCa-UNJBG/MiniMarket-APP-Releases/releases/latest/download/latest.json"
  ]
}
```

---

## 4. Configuración de Secretos en GitHub (`MiniMarket-APP`)
Para permitir que nuestro flujo CI/CD publique el instalador en el *otro* repositorio, fuimos a **Settings -> Secrets and variables -> Actions** en el repo privado y creamos:

1. `TAURI_PRIVATE_KEY`: Clave privada generada arriba.
2. `TAURI_PASSWORD`: Contraseña asignada a la clave privada.
3. `RELEASE_GITHUB_TOKEN`: Un *Personal Access Token* clásico con permiso `repo`, que permite que GitHub Actions tenga autorización para "escribir" o "subir archivos" al repositorio público remoto `MiniMarket-APP-Releases`.

---

## 5. Automatización de Lanzamientos (GitHub Actions)
El archivo `.github/workflows/release.yml` en el repositorio privado hace lo siguiente cada vez que se detecta un Tag (ej. `v1.0.1`):
1. **Compila la App**: Usando Node.js y Rust.
2. **Firma el instalador**: Usando `tauri-action` con las claves privadas.
3. **Genera `latest.json`**: Crea el archivo de manifiesto indicando la versión, la firma `.sig` y la URL final donde se hospedará el `.exe` en el repositorio público.
4. **Sube al repositorio Público**: Usando `softprops/action-gh-release@v2` y el `RELEASE_GITHUB_TOKEN`, envía todo a la pestaña de Releases de `MiniMarket-APP-Releases`.

---

## 6. Pasos para Lanzar una Actualización:
Para que tus usuarios reciban una nueva versión:
1. Sube la versión en `package.json` y `tauri.conf.json` (ej. `1.0.2`).
2. Haz tus commits normales.
3. Envía el Tag a GitHub:
```bash
git tag v1.0.2
git push origin v1.0.2
```
4. ¡El flujo automático construirá, firmará y subirá el instalador a tu repositorio público sin tu intervención!
