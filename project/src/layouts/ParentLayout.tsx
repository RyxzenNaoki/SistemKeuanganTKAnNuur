import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ParentSidebar from '../components/parent/ParentSidebar';
import ParentHeader from '../components/parent/ParentHeader';

const ParentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <ParentSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <ParentHeader onMenuButtonClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 pb-10 pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} TK Ceria. Semua hak dilindungi.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ParentLayout;