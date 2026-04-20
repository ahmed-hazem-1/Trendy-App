import { Outlet, useSearchParams } from "react-router-dom";
import { useState } from "react";
import NavBar from "./NavBar";
import BottomNav from "./BottomNav";
import MobileSidebar from "./MobileSidebar";
import AdminModal from "./AdminModal";
import OnboardingInterests from "./OnboardingInterests";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile } from "../api/authApi";
import BottomSheet from "./BottomSheet";
import ScrollToTop from "./ScrollToTop";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const { profile, refreshProfile, isAuthenticated } = useAuth();
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  
  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const openBottomSheet = () => setBottomSheetOpen(true);
  const closeBottomSheet = () => setBottomSheetOpen(false);
  const openAdminModal = () => setAdminModalOpen(true);
  const closeAdminModal = () => setAdminModalOpen(false);

  // Check if user needs onboarding (authenticated, has profile, but interests is empty)
  // We only show this if the profile has been loaded and explicitly has an empty/null interests field
  const needsOnboarding = 
    isAuthenticated && 
    profile && 
    (!profile.interests || profile.interests.length === 0);

  const handleOnboardingComplete = async (interests) => {
    if (!profile?.id) return;
    setIsOnboardingLoading(true);
    try {
      await updateUserProfile(profile.id, { 
        interests,
        status: 'ACTIVE' // Promote from PENDING if needed
      });
      await refreshProfile();
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar onMenuClick={toggleSidebar} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-[calc(100px+env(safe-area-inset-bottom))] sm:pt-6 sm:pb-[calc(120px+env(safe-area-inset-bottom))] lg:py-8">
        <Outlet context={{ sidebarOpen, closeSidebar, bottomSheetOpen, closeBottomSheet, openBottomSheet }} />
      </main>
      <BottomSheet
        isOpen={bottomSheetOpen}
        onClose={closeBottomSheet}
        activeCategory={activeCategory}
      />
      <BottomNav onCategoriesOpen={openBottomSheet} onAdminModalOpen={openAdminModal} />
      <AdminModal isOpen={adminModalOpen} onClose={closeAdminModal} />
      <ScrollToTop />

      {needsOnboarding && (
        <OnboardingInterests 
          onComplete={handleOnboardingComplete} 
          isLoading={isOnboardingLoading} 
        />
      )}
    </div>
  );
}
