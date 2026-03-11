import { Outlet } from "react-router-dom";
import { useState } from "react";
import NavBar from "./NavBar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar onMenuClick={toggleSidebar} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <Outlet context={{ sidebarOpen, closeSidebar }} />
      </main>
    </div>
  );
}
