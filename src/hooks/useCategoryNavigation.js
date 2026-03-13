import { useNavigate } from "react-router-dom";

/**
 * Hook to navigate to feed with a selected category applied
 * Ensures user is taken to /feed with the category parameter set in the URL
 */
export function useCategoryNavigation() {
  const navigate = useNavigate();

  const navigateToFeedWithCategory = (categorySlug) => {
    const params = new URLSearchParams();
    
    if (categorySlug && categorySlug !== "all") {
      params.set("category", categorySlug);
    }

    const query = params.toString();
    const target = query ? `/feed?${query}` : "/feed";
    navigate(target);
  };

  return navigateToFeedWithCategory;
}
