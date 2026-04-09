import { Bookmark, Trash2, ExternalLink, Loader } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
import { useUserBookmarks, useToggleBookmark } from "../hooks/useNews";
import { useAuth } from "../hooks/useAuth";
import StatusBadge from "../features/feed/StatusBadge";
import MobileSidebar from "../UI/MobileSidebar";
import { useState } from "react";
import { AdCard, MobileAdStrip } from "../UI/Ads";
import { MOCK_ADS } from "../utils/adsData";
import { selectIsPremium } from "../store/authSlice";
import {
  resolvePostImageView,
  POST_MEDIA_FRAME_PRESETS,
  POST_MEDIA_IMAGE_CLASS,
} from "../postMedia";

export default function Saved() {
  const { sidebarOpen, closeSidebar } = useOutletContext();
  const { profile } = useAuth();
  const isPremium = useSelector(selectIsPremium);
  const { data: bookmarks = [], isLoading: bookmarksLoading, isFetching: bookmarksFetching } = useUserBookmarks();
  const toggleBookmarkMutation = useToggleBookmark();
  const [activeCategory, setActiveCategory] = useState("all");

  const handleRemoveBookmark = async (newsId) => {
    if (!profile?.id) {
      console.warn("Cannot remove bookmark: user not authenticated");
      return;
    }
    try {
      await toggleBookmarkMutation.mutateAsync({
        newsItemId: newsId,
        userId: profile.id,
      });
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      alert("حدث خطأ أثناء إزالة الخبر من المحفوظات");
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
      <div className={`grid grid-cols-1 ${!isPremium ? 'lg:grid-cols-[240px_1fr] xl:grid-cols-[250px_1fr_250px]' : 'max-w-3xl mx-auto'} gap-4 lg:gap-5 mx-auto`}>
        {/* Right ads sidebar */}
        {!isPremium && (
          <aside className="hidden lg:block sticky top-24 self-start space-y-4">
            {MOCK_ADS.slice(0, 2).map((ad) => (
              <AdCard key={ad.id} ad={ad} variant="sidebar" />
            ))}
          </aside>
        )}

        {/* Main Content */}
        <section className="space-y-4 lg:space-y-5">
          {/* Page Header */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
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
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:transition"
                >
                  استكشف الأخبار
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => {
                  const newsItem = bookmark.news_items;
                  if (!newsItem) return null;

                  const categoryMeta = Array.isArray(newsItem.categories)
                    ? (newsItem.categories[0] ?? null)
                    : (newsItem.categories ?? null);
                  const category =
                    categoryMeta?.name ||
                    newsItem.news_categories?.[0]?.categories?.name ||
                    "عام";
                  const categorySlug =
                    categoryMeta?.slug ||
                    newsItem.news_categories?.[0]?.categories?.slug ||
                    null;
                  const postImage = resolvePostImageView({
                    category,
                    categorySlug,
                    imageUrl: newsItem.image_url,
                  });
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
                      className="rounded-xl border border-gray-100 bg-gray-50/30 p-4 hover:bg-white hover:border-teal-200 transition group/card"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-20 sm:w-24 md:w-28 ${POST_MEDIA_FRAME_PRESETS.saved} shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100`}
                        >
                          <img
                            src={postImage.src}
                            alt={`صورة تصنيف ${category}`}
                            className={POST_MEDIA_IMAGE_CLASS}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={newsItem.verification_status} />
                            <span className="text-xs text-gray-300">•</span>
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[10px] text-teal-600 font-bold uppercase tracking-wider">
                              {category}
                            </span>
                          </div>
                          <Link to={`/posts/${newsItem.id}`} className="block">
                            <h3 className="text-lg font-bold text-gray-900 group-hover/card:text-teal-600 transition-colors mb-2 leading-tight line-clamp-2">
                              {newsItem.title}
                            </h3>
                          </Link> 
                          
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-gray-100/50 text-gray-500">
                              <Bookmark className="h-3 w-3 fill-current" />
                              <span className="text-[11px] font-medium">
                                حُفظ في {savedDate}
                              </span>
                            </div>
                            
                            {bookmark.note && (
                              <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                                <span className="text-[11px] font-medium italic line-clamp-1">
                                  {bookmark.note}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 self-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <Link
                            to={`/posts/${newsItem.id}`}
                            className="p-2.5 rounded-xl bg-white text-gray-400 border border-gray-100 hover:text-teal-600 hover:border-teal-200 transition-all hover:scale-110"
                            title="عرض الخبر"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleRemoveBookmark(newsItem.id)}
                            className="p-2.5 rounded-xl bg-white text-gray-400 border border-gray-100 hover:text-red-600 hover:border-red-200 transition-all hover:scale-110"
                            title="إزالة من المحفوظات"
                          >
                            <Trash2 className="h-4 w-4" />
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
        {!isPremium && (
          <aside className="hidden xl:block sticky top-24 self-start space-y-4">
            {MOCK_ADS.slice(2).map((ad) => (
              <AdCard key={ad.id} ad={ad} variant="sidebar" />
            ))}
          </aside>
        )}
      </div>
    </>
  );
}
