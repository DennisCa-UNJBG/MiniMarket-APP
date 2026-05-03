import type { ReactNode } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { TopBar } from '../components/ui/TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-200 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar lateral */}
      <Sidebar />

      {/* Área de contenido */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
