import { useState } from 'react';
import { 
  HelpCircle,
  Lightbulb,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { flowSteps, detailedGuides } from './components/GuidesData';

export function Ayuda() {
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const toggleGuide = (id: string) => {
    setExpandedGuide(expandedGuide === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-6">
      {/* Hero Section */}
      <header className="relative py-16 px-8 bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-700 overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-xl mb-4">
            <HelpCircle size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Manual de Usuario Integral
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-3xl mx-auto">
            Explora a detalle el funcionamiento de MiniMarket Pro a través de nuestras guías interactivas.
          </p>
        </div>
      </header>

      {/* Flujo de Información */}
      <section className="space-y-10">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <ChevronRight className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">Flujo de Trabajo Detallado</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {flowSteps.map((step, idx) => (
            <div key={step.title} className="bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-xl transition-all duration-300 p-8 flex flex-col gap-6 group">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <span className="text-4xl font-black text-zinc-100 dark:text-zinc-700/50">0{idx + 1}</span>
              </div>
              <div className="space-y-4 flex-1">
                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">{step.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t border-zinc-50 dark:border-zinc-700">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Acciones clave:</p>
                {step.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Directorio de Vistas - ACORDEÓN DETALLADO */}
      <section className="space-y-10">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <FileText className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">Explorador de Módulos</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 px-2">
          {detailedGuides.map((guide) => (
            <div 
              key={guide.id} 
              className={`bg-white dark:bg-zinc-800 rounded-3xl border transition-all duration-300 overflow-hidden ${
                expandedGuide === guide.id 
                ? 'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-none' 
                : 'border-zinc-100 dark:border-zinc-700 shadow-sm'
              }`}
            >
              <button 
                onClick={() => toggleGuide(guide.id)}
                className="w-full flex items-center justify-between p-6 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${
                    expandedGuide === guide.id ? 'bg-blue-600 text-white' : 'bg-zinc-50 dark:bg-zinc-900/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
                  }`}>
                    {guide.icon}
                  </div>
                  <span className={`font-black text-lg tracking-tight ${
                    expandedGuide === guide.id ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-white'
                  }`}>
                    {guide.title}
                  </span>
                </div>
                {expandedGuide === guide.id ? <ChevronDown className="text-blue-500" /> : <ChevronRight className="text-zinc-400" />}
              </button>
              
              <div 
                className={`transition-all duration-500 ease-in-out ${
                  expandedGuide === guide.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-8 pt-2 border-t border-zinc-50 dark:border-zinc-700/50">
                  <div className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    {guide.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Soporte y Ayuda */}
      <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Lightbulb size={200} />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-4xl font-semibold">¿Necesita asistencia experta?</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Nuestro equipo de soporte está disponible para ayudarle con la configuración técnica de sus sedes, problemas de red o personalización de comprobantes.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                <p className="text-xs opacity-70">Email Oficial</p>
                <p className="font-bold">dennis.tacna@gmail.com</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                <p className="text-xs opacity-70">Soporte Técnico</p>
                <p className="font-bold">+51 925 599 814</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <MessageSquare size={24} />
              Preguntas Rápidas
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <p className="font-bold mb-1">¿Cómo actualizo mi stock físico?</p>
                <p className="text-sm opacity-80">Hágalo desde el módulo de Compras para mantener el rastro histórico, o use Ajustes en Inventario para correcciones menores.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <p className="font-bold mb-1">¿Mis datos están seguros sin internet?</p>
                <p className="text-sm opacity-80">Sí, toda la información se guarda localmente en una base de datos encriptada en su equipo. La red solo es necesaria para sincronizar sedes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center pt-8 border-t border-zinc-100 dark:border-zinc-700">
        <p className="text-zinc-400 dark:text-zinc-500 text-sm">
          MiniMarket Pro v1.0.0 • Manual de Usuario Detallado • 2026
        </p>
      </footer>
    </div>
  );
}
