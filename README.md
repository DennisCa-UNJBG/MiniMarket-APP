# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Características Destacadas

- **Sistema de Licencias Online:** Integración con Supabase para validación de suscripciones por tiempo de uso con anclaje a hardware (Hardware ID) y soporte caché offline.

## Requisitos de Software

Para poder desarrollar, ejecutar y compilar este proyecto en un entorno local, asegúrate de tener instalado el siguiente software:

- **Node.js**: Se recomienda la versión LTS (v18 o superior). Se utiliza para la gestión de dependencias y el servidor de desarrollo del frontend (React + Vite).
- **Rust**: Esencial para el backend de Tauri. Se requiere la versión **1.77.2** o superior. Puedes instalarlo siguiendo las instrucciones oficiales en [rustup.rs](https://rustup.rs/).
- **Visual Studio Build Tools 2026**: Es necesario instalar las herramientas de compilación de C++. En el instalador de Visual Studio, asegúrate de seleccionar la carga de trabajo:
  - **Desarrollo para el escritorio con C++** (Desktop development with C++).
  - Esto incluye componentes críticos como el **SDK de Windows 11** y las herramientas de **CMake** para Windows.
- **.NET SDK**: Se requiere la versión **9.0** o superior para la integración con los componentes del sistema y la generación del instalador.
- **WebView2**: El motor de navegación utilizado por Tauri en Windows para renderizar la interfaz (incluido por defecto en Windows 10 y 11).

## Comandos del Proyecto

Asegúrate de haber instalado las dependencias primero:

```bash
npm install
```

### Desarrollo (con recarga en caliente)

Inicia la aplicación de escritorio Tauri en modo desarrollo. Abre la ventana nativa con el frontend de Vite cargado en tiempo real:

```bash
npm run tauri dev
```

> **Nota:** La primera ejecución puede tardar varios minutos mientras Rust compila el backend.

### Solo frontend (sin ventana nativa)

Si solo quieres trabajar en la UI con Vite en el navegador:

```bash
npm run dev
```

### Compilar para producción

Genera el ejecutable/instalador de la aplicación para la plataforma actual (`.exe` + instalador en Windows):

```bash
npm run tauri build
```

Los artefactos compilados se ubican en `src-tauri/target/release/bundle/`.

### Vista previa del build del frontend

Sirve localmente el build de producción del frontend (solo Vite, sin Tauri):

```bash
npm run preview
```

### Otros comandos útiles de Tauri CLI

| Comando | Descripción |
|---|---|
| `npm run tauri info` | Muestra información del entorno (versiones de Rust, Tauri, Node, etc.) |
| `npm run tauri icon` | Genera los iconos de la app a partir de una imagen fuente |
| `npm run tauri plugin` | Gestiona plugins de Tauri |

---

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
