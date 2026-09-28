import { APP_COPYRIGHT } from '../config/branding';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ParentSidebar from '../components/parent/ParentSidebar';
import ParentHeader from '../components/parent/ParentHeader';

const ParentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <ParentSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <ParentHeader onMenuButtonClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 pb-10 pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        
        <footer className="bg-white border-t border-slate-200 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-slate-500">
              {APP_COPYRIGHT}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ParentLayout;