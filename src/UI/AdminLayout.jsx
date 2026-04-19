import React, { useState } from 'react';
import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import NavBar from './NavBar';
import BottomNav from './BottomNav';
import MobileSidebar from './MobileSidebar';
import AdminModal from './AdminModal';
import ProfileCard from './ProfileCard';
import { ShieldAlert, Layers, Megaphone, Users } from 'lucide-react';
import BottomSheet from './BottomSheet';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  
  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const openBottomSheet = () => setBottomSheetOpen(true);
  const closeBottomSheet = () => setBottomSheetOpen(false);
  const openAdminModal = () => setAdminModalOpen(true);
  const closeAdminModal = () => setAdminModalOpen(false);

  const navItems = [
    { label: 'المصادر والتصنيفات', path: '/admin/sources', icon: Layers },
    { label: 'الإعلانات والترويج', path: '/admin/ads', icon: Megaphone },
    { label: 'الفريق والإدارة', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-cairo rtl flex flex-col" dir="rtl">
      {/* Top Navbar matched from User feed */}
      <NavBar onMenuClick={toggleSidebar} />

      {/* Main Content Area mirroring Feed layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pt-6 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:py-8">
        
        {/* Same Grid Layout as Feed: Sidebar(270px) + Main Content(1fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-4 sm:gap-6">
          
          {/* Admin Sidebar (Matches UserSidebar) */}
          <div className="hidden lg:block">
            <div className="sticky top-[88px] space-y-5">
              <ProfileCard />
              
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <ShieldAlert className="h-5 w-5 text-teal-600" />
                  <h4 className="text-sm font-bold text-gray-800">
                    لوحة تحكم المسؤول
                  </h4>
                </div>
                <nav className="space-y-1.5">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `
                        flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition cursor-pointer
                        ${isActive 
                          ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
              
              {/* Quick Links / Footer in sidebar just like in Feed */}
              <div className="px-2">
                <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 mb-2">
                  <a href="#" className="hover:underline">حول Trendy</a>
                  <a href="#" className="hover:underline">المساعدة</a>
                  <a href="#" className="hover:underline">شروط الاستخدام</a>
                  <a href="#" className="hover:underline">الخصوصية</a>
                </nav>
                <p className="text-xs text-gray-400">© {new Date().getFullYear()} Trendy</p>
              </div>
            </div>
          </div>

          {/* Admin Page Content */}
          <section className="min-w-0">
            <Outlet context={{ sidebarOpen, closeSidebar, bottomSheetOpen, closeBottomSheet, openBottomSheet }} />
          </section>

        </div>
      </main>

      <BottomSheet
        isOpen={bottomSheetOpen}
        onClose={closeBottomSheet}
        activeCategory={activeCategory}
      />
      <BottomNav onCategoriesOpen={openBottomSheet} onAdminModalOpen={openAdminModal} />
      <AdminModal isOpen={adminModalOpen} onClose={closeAdminModal} />
      
      <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
    </div>
  );
}
