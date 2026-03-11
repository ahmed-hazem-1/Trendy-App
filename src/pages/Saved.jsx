import { Bookmark, Trash2, ExternalLink, Loader } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { useUserBookmarks, useToggleBookmark } from "../hooks/useNews";
import { useAuth } from "../hooks/useAuth";
import StatusBadge from "../features/feed/StatusBadge";
import MobileSidebar from "../UI/MobileSidebar";
import BottomSheet from "../UI/BottomSheet";
import { useState } from "react";
import { AdCard, MobileAdStrip } from "../UI/Ads";
import { MOCK_ADS } from "../utils/adsData";

export default function Saved() {
  const { sidebarOpen, closeSidebar, bottomSheetOpen, closeBottomSheet } = useOutletContext();
  const { profile } = useAuth();
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useUserBookmarks();
  const toggleBookmarkMutation = useToggleBookmark();
  const [activeCategory, setActiveCategory] = useState("all");

  const handleRemoveBookmark = async (newsId) => {
    if (!profile?.id) return;
    try {
      await toggleBookmarkMutation.mutateAsync({
        newsItemId: newsId,
        userId: profile.id,
      });
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }
  };

  return (
    <>
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[250px_1fr_250px] gap-4 lg:gap-5 max-w-6xl mx-auto">
        {/* Right ads sidebar */}
        <aside className="hidden lg:block sticky top-24 self-start space-y-4">
          {MOCK_ADS.slice(0, 2).map((ad) => (
            <AdCard key={ad.id} ad={ad} variant="sidebar" />
          ))}
        </aside>

        {/* Main Content */}
        <section className="space-y-4 lg:space-y-5">
          {/* Page Header */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">الأخبار المحفوظة</h1>
                <p className="text-sm text-gray-500">
                  {bookmarks.length > 0 ? `${bookmarks.length} خبر محفوظ` : "لا توجد أخبار محفوظة"}
                </p>
              </div>
            </div>
          </div>

          {/* Saved Posts List */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
            {bookmarksLoading ? (
              <div className="text-center py-12">
                <Loader className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">جارٍ التحميل...</p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-16">
                <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  لا توجد أخبار محفوظة
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  احفظ الأخبار المهمة للرجوع إليها لاحقاً
                </p>
                <Link
                  to="/feed"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:shadow-md transition"
                >
                  استكشف الأخبار
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => {
                  const newsItem = bookmark.news_items;
                  if (!newsItem) return null;

                  const category =
                    newsItem.news_categories?.[0]?.categories?.name || "عام";
                  const savedDate = new Date(bookmark.saved_at).toLocaleDateString(
                    "ar-EG",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  );

                  return (
                    <div
                      key={bookmark.id}
                      className="rounded-xl border border-gray-200 bg-white hover:border-teal-200 hover:shadow-md p-4 transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <StatusBadge status={newsItem.verification_status} />
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-teal-600 font-medium">
                              {category}
                            </span>
                          </div>
                          <Link to={`/posts/${newsItem.id}`} className="block group">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-teal-600 transition mb-2 line-clamp-2">
                              {newsItem.title}
                            </h3>
                          </Link>
                          {newsItem.content && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {newsItem.content}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              حُفظ في {savedDate}
                            </span>
                            {bookmark.note && (
                              <>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-gray-500 italic line-clamp-1">
                                  {bookmark.note}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Link
                            to={`/posts/${newsItem.id}`}
                            className="p-2.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-gray-50 transition"
                            title="عرض الخبر"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleRemoveBookmark(newsItem.id)}
                            className="p-2.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="إزالة من المحفوظات"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile ads */}
          <MobileAdStrip />
        </section>

        {/* Left ads sidebar */}
        <aside className="hidden xl:block sticky top-24 self-start space-y-4">
          {MOCK_ADS.slice(2).map((ad) => (
            <AdCard key={ad.id} ad={ad} variant="sidebar" />
          ))}
        </aside>
      </div>
      <BottomSheet
        isOpen={bottomSheetOpen}
        onClose={closeBottomSheet}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    </>
  );
}
