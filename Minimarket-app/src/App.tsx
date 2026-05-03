import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  function toggleDarkMode() {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
    }
    setDarkMode(!darkMode);
  }

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Barra superior */}
      <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-gray-800 shadow-md">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          🛒 Minimarket App
        </h1>
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800 transition-colors"
        >
          {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
        </button>
      </header>

      {/* Contenido principal */}
      <main className="flex flex-col items-center justify-center px-4 py-16 gap-8">
        {/* Card de prueba */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
            ✅ Tailwind CSS funcionando
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
            Prueba el formulario y el toggle de tema
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
            className="flex flex-col gap-4"
          >
            <input
              id="greet-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Escribe tu nombre..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
            >
              Saludar
            </button>
          </form>

          {greetMsg && (
            <p className="mt-4 text-center text-green-600 dark:text-green-400 font-medium">
              {greetMsg}
            </p>
          )}
        </div>

        {/* Badges de tecnología */}
        <div className="flex gap-3 flex-wrap justify-center">
          {["Tauri v2", "React 19", "Tailwind CSS v3", "Vite"].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
