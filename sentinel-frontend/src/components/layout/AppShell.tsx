import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { Breadcrumb } from './Breadcrumb';
import { useLiveBehaviourStream } from '../../hooks/usePolling';

export const AppShell: React.FC = () => {
  const { lastUpdated } = useLiveBehaviourStream();

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-gray-100 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader lastUpdated={lastUpdated} />
        <Breadcrumb />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
