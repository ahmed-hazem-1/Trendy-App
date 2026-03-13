import { Outlet } from "react-router-dom";
import { useState } from "react";
import NavBar from "./NavBar";
import BottomNav from "./BottomNav";
import MobileSidebar from "./MobileSidebar";
import OnboardingInterests from "./OnboardingInterests";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile } from "../api/authApi";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const { profile, refreshProfile, isAuthenticated } = useAuth();
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  
  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const openBottomSheet = () => setBottomSheetOpen(true);
  const closeBottomSheet = () => setBottomSheetOpen(false);

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
    <div className="min-h-screen bg-gray-100">
      <NavBar onMenuClick={toggleSidebar} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <Outlet context={{ sidebarOpen, closeSidebar, bottomSheetOpen, closeBottomSheet, openBottomSheet }} />
      </main>
      <BottomNav onCategoriesOpen={openBottomSheet} />

      {needsOnboarding && (
        <OnboardingInterests 
          onComplete={handleOnboardingComplete} 
          isLoading={isOnboardingLoading} 
        />
      )}
    </div>
  );
}
