import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Layers, ShieldCheck, Link as LinkIcon, Plus, Activity, Edit2, Trash2 } from 'lucide-react';
import Button from '../UI/Button';
import FormSelect from '../UI/FormSelect';

export default function CategorySourceManager() {
  const [categories, setCategories] = useState([]);
  const [trustedSources, setTrustedSources] = useState([]);
  const [newsCounts, setNewsCounts] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categorySources, setCategorySources] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [linkForm, setLinkForm] = useState({ sourceId: '' });
  const [isLinking, setIsLinking] = useState(false);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [sourceForm, setSourceForm] = useState({ name: '', domain: '' });
  const [selectedCategoriesForSource, setSelectedCategoriesForSource] = useState([]);
  const [isCreatingSource, setIsCreatingSource] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsSyncing(true);
    // Fetch categories and sources
    const [catsRes, sourcesRes, newsRes] = await Promise.all([
      supabase.from('categories').select('*').order('display_order', { ascending: true }),
      supabase.from('trusted_sources').select('*').eq('is_active', true),
      supabase.from('news_items').select('category_id')
    ]);
    
    if (catsRes.data) {
      setCategories(catsRes.data);
      if (!selectedCategoryId && catsRes.data.length > 0) {
        setSelectedCategoryId(catsRes.data[0].id);
      }
    }
    if (sourcesRes.data) setTrustedSources(sourcesRes.data);
    
    // Manual count mapping since PostgREST relations might be complex to deduce blind
    if (newsRes.data) {
      const counts = {};
      newsRes.data.forEach(item => {
        if (item.category_id) {
          counts[item.category_id] = (counts[item.category_id] || 0) + 1;
        }
      });
      setNewsCounts(counts);
    }
    
    setIsSyncing(false);
  }

  async function fetchCategorySources(categoryId) {
    if (!categoryId) {
      setCategorySources([]);
      return;
    }

    setIsLoadingSources(true);
    const { data, error } = await supabase
      .from('category_sources')
      .select('id, is_active, source_id')
      .eq('category_id', categoryId);

    if (error) {
      console.warn('Failed to fetch category sources:', error.message);
      setCategorySources([]);
    } else {
      setCategorySources(data || []);
    }
    setIsLoadingSources(false);
  }

  useEffect(() => {
    if (selectedCategoryId) {
      fetchCategorySources(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const handleCreateCategory = async () => {
    const name = categoryForm.name.trim();
    const rawSlug = categoryForm.slug.trim();
    if (!name) {
      alert('من فضلك أدخل اسم الفئة أولاً.');
      return;
    }

    const autoSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const finalSlug =
      rawSlug ||
      autoSlug;

    setIsCreatingCategory(true);
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name,
          slug: finalSlug || undefined,
          display_order: categories.length + 1,
          is_active: true,
        },
      ])
      .select()
      .single();
    setIsCreatingCategory(false);

    if (error) {
      console.error('Failed to create category:', error.message);
      alert('تعذر إنشاء الفئة.');
      return;
    }

    setCategories([...categories, data]);
    setSelectedCategoryId(data.id);
    setCategoryForm({ name: '', slug: '' });
    setIsCategoryModalOpen(false);
  };

  const handleDeleteSource = async (id) => {
    const { error } = await supabase.from('category_sources').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete category source:', error.message);
      alert('تعذر حذف المصدر من الفئة.');
      return;
    }
    setCategorySources((prev) => prev.filter((link) => link.id !== id));
  };

  const handleToggleSourceStatus = async (id, isActive) => {
    const { error } = await supabase
      .from('category_sources')
      .update({ is_active: !isActive })
      .eq('id', id);
    if (error) {
      console.error('Failed to update source status:', error.message);
      alert('تعذر تحديث حالة المصدر.');
      return;
    }
    setCategorySources((prev) =>
      prev.map((link) => (link.id === id ? { ...link, is_active: !isActive } : link)),
    );
  };

  const handleCreateSource = async () => {
    if (selectedCategoriesForSource.length === 0) {
      alert('اختر فئة واحدة على الأقل للمصدر الجديد.');
      return;
    }

    const name = sourceForm.name.trim();
    const domain = sourceForm.domain.trim();

    if (!name || !domain) {
      alert('من فضلك أدخل اسم الموقع والرابط أو النطاق.');
      return;
    }

    setIsCreatingSource(true);

    // Check if domain already exists
    const { data: existingDomain, error: checkError } = await supabase
      .from('trusted_sources')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existingDomain) {
      alert('هذا النطاق موجود بالفعل في قاعدة البيانات.');
      setIsCreatingSource(false);
      return;
    }

    const { data: newSource, error: sourceError } = await supabase
      .from('trusted_sources')
      .insert([
        {
          name,
          domain,
          is_active: true,
          current_credibility_score: 80.00,
        },
      ])
      .select()
      .single();

    if (sourceError) {
      console.error('Failed to create source:', sourceError.message);
      alert('تعذر إنشاء المصدر الجديد.');
      setIsCreatingSource(false);
      return;
    }

    setTrustedSources((prev) => [...prev, newSource]);

    // Link source to all selected categories
    const categorySourceLinks = selectedCategoriesForSource.map(catId => ({
      category_id: catId,
      source_id: newSource.id,
      region: 'Global',
      is_active: true,
    }));

    const { error: linkError } = await supabase
      .from('category_sources')
      .insert(categorySourceLinks);

    setIsCreatingSource(false);

    if (linkError) {
      console.error('Failed to link new source:', linkError.message);
      alert('تم إنشاء المصدر لكن تعذر ربطه بالفئات.');
    }

    setSourceForm({ name: '', domain: '' });
    setSelectedCategoriesForSource([]);
    setIsSourceModalOpen(false);
    if (selectedCategoryId) {
      fetchCategorySources(selectedCategoryId);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('هل تريد حقاً حذف هذه الفئة وجميع الروابط المرتبطة بها؟')) {
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Failed to delete category:', error.message);
      alert('تعذر حذف الفئة.');
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
      setCategorySources([]);
    }
  };

  const handleDeleteSourceFromCategory = async (linkId) => {
    const { error } = await supabase
      .from('category_sources')
      .delete()
      .eq('id', linkId);

    if (error) {
      console.error('Failed to delete source link:', error.message);
      alert('تعذر حذف الرابط.');
      return;
    }

    setCategorySources((prev) => prev.filter((s) => s.id !== linkId));
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">إدارة الفئات والمصادر</h1>
          <p className="text-gray-500 text-sm">مراقبة التصنيفات العالمية وربط مصادر الثقة الإقليمية.</p>
        </div>
      </div>

      {/* KPI Cards (Matching Stitch UI Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         
         <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 flex flex-col justify-between hover:transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold text-gray-500 tracking-wider">إجمالي الفئات</span>
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100"><Layers size={20}/></div>
            </div>
            <div className="flex items-end gap-3">
               <span className="text-4xl font-black text-gray-900 tracking-tighter">{categories.length}</span>
               <span className="text-sm text-green-500 font-bold mb-1 bg-green-50 px-2 py-0.5 rounded-full">+2.4%</span>
            </div>
         </div>

         <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 flex flex-col justify-between hover:transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold text-gray-500 tracking-wider">مصادر موثوقة</span>
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100"><ShieldCheck size={20}/></div>
            </div>
            <div className="flex items-end gap-3">
               <span className="text-4xl font-black text-gray-900 tracking-tighter">{trustedSources.length}</span>
               <span className="text-sm text-green-500 font-bold mb-1 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
         </div>
         
         <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 flex flex-col justify-between hover:transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold text-gray-500 tracking-wider">حالة النظام</span>
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100"><Activity size={20}/></div>
            </div>
            <div className="flex items-end gap-3">
               <span className="text-4xl font-black text-gray-900 tracking-tighter">99.9%</span>
               <span className="text-sm text-gray-400 font-bold mb-1">Stable</span>
            </div>
         </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
         
         {/* Categories List (Left) as cards */}
         <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-7 flex flex-col gap-4">
            <div className="flex items-baseline justify-between mb-1">
              <div>
                <h3 className="text-sm font-black text-gray-800 tracking-widest uppercase">الفئات المتاحة</h3>
                <p className="text-xs text-gray-400 mt-1">اضغط على البطاقة لاختيار الفئة وإدارة مصادرها.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">{categories.length} فئة</span>
                <Button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="w-auto h-8 px-3 rounded-lg text-[11px] font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus size={12} /> فئة جديدة
                </Button>
              </div>
            </div>

            {categories.length === 0 && !isSyncing && (
              <p className="text-center py-8 text-gray-400 text-sm">لا توجد فئات حالياً.</p>
            )}

            <div className="space-y-3 max-h-[440px] overflow-y-auto pe-1">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                const volume = newsCounts[cat.id] || 0;
                return (
                  <div
                    key={cat.id}
                    className={`w-full rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                      isSelected
                        ? 'border-teal-300 bg-teal-50/80'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="min-w-0 text-start flex-1"
                    >
                      <p className="font-bold text-gray-900 text-[15px] truncate">{cat.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                            cat.is_active
                              ? 'bg-green-50 text-green-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {cat.is_active ? 'Active' : 'Maintenance'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-semibold text-gray-600">{volume} خبر</span>
                      </div>
                    </button>
                    <div className="shrink-0 flex items-center gap-2">
                      {isSelected ? (
                        <span className="text-teal-600 font-semibold text-[11px]">مختار</span>
                      ) : (
                        <LinkIcon size={18} className="text-gray-300" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit handler can be implemented later
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="تعديل"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {isSyncing && (
              <div className="pt-2 text-center text-xs text-gray-400 animate-pulse">
                جاري المزامنة مع الخوادم...
              </div>
            )}
         </div>

         {/* Category + Sources Manager (Right) */}
         <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 lg:sticky lg:top-[88px]">
           <div className="flex items-start gap-4 mb-8">
             <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
               <LinkIcon size={24}/>
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-900 leading-tight">ربط مصدر</h2>
               {selectedCategoryId && (
                 <p className="mt-1 text-[11px] font-semibold text-gray-500">
                   الفئة الحالية:
                   <span className="ms-1 text-teal-700">
                     {categories.find((c) => c.id === selectedCategoryId)?.name || ''}
                   </span>
                 </p>
               )}
             </div>
           </div>

           {!selectedCategoryId ? (
             <div className="mt-4 text-sm text-gray-400">
               اختر فئة من القائمة على اليسار لعرض وإدارة المصادر المرتبطة بها.
             </div>
           ) : (
             <div className="space-y-4">
               <div>
                 <div className="flex items-center justify-between mb-3">
                   <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">المصادر</span>
                   <Button
                     onClick={() => setIsSourceModalOpen(true)}
                     className="w-auto px-3 h-8 rounded-lg text-[11px] font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                   >
                     <Plus size={12} /> مصدر جديد
                   </Button>
                 </div>
                 <div className="space-y-2 max-h-80 overflow-y-auto">
                   {isLoadingSources && <p className="text-xs text-gray-400">جاري التحميل...</p>}
                   {!isLoadingSources && categorySources.length === 0 && (
                     <p className="text-xs text-gray-400">لا توجد مصادر مرتبطة</p>
                   )}
                   {!isLoadingSources && categorySources.map((link) => {
                     const source = trustedSources.find((s) => s.id === link.source_id);
                     if (!source) return null;
                     return (
                       <div key={link.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50">
                         <div className="flex-1">
                           <p className="font-semibold text-sm text-gray-900">{source.name}</p>
                           <p className="text-xs text-gray-500">{source.domain}</p>
                         </div>
                         <div className="flex items-center gap-1">
                           <button
                             type="button"
                             onClick={() => handleToggleSourceStatus(link.id, link.is_active)}
                             className={`px-2 py-1 text-[10px] rounded font-semibold transition-colors ${
                               link.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                             }`}
                           >
                             {link.is_active ? 'على' : 'عن'}
                           </button>
                           <button
                             type="button"
                             onClick={() => handleDeleteSourceFromCategory(link.id)}
                             className="p-1 text-red-600 hover:bg-red-50 rounded"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             </div>
           )}
         </div>

      </div>

      {/* Category creation modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">إضافة فئة جديدة</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                إغلاق
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">اسم الفئة</label>
                <input
                  className="w-full rounded-lg border bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 outline-none ring-0 transition focus:border-teal-400 focus:bg-white"
                  placeholder="مثال: سياسة، اقتصاد، صحة"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">الـ Slug (اختياري)</label>
                <input
                  className="w-full rounded-lg border bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 outline-none ring-0 transition focus:border-purple-400 focus:bg-white"
                  placeholder="مثال: politics, economy, health"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                  الـ Slug يُكتب بحروف إنجليزية صغيرة بدون مسافات (a-z, 0-9) ويمكن استخدام علامة - للفصل بين الكلمات.
                  إذا تركته فارغاً سيتم توليده تلقائياً من اسم الفئة.
                </p>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <Button
                  onClick={handleCreateCategory}
                  isLoading={isCreatingCategory}
                  className="w-auto px-4 h-9 rounded-lg text-sm bg-purple-600 hover:bg-purple-700 text-white"
                >
                  حفظ الفئة
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source creation modal */}
      {isSourceModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">إضافة مصدر موثوق</h3>
              <button
                type="button"
                onClick={() => { setIsSourceModalOpen(false); setSelectedCategoriesForSource([]); }}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                إغلاق
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">اسم الموقع</label>
                <input
                  className="w-full rounded-lg border bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 outline-none ring-0 transition focus:border-teal-400 focus:bg-white"
                  placeholder="مثال: BBC Arabic"
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">رابط أو نطاق الموقع</label>
                <input
                  className="w-full rounded-lg border bg-gray-50 py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 outline-none ring-0 transition focus:border-teal-400 focus:bg-white"
                  placeholder="مثال: bbc.com أو https://bbc.com"
                  value={sourceForm.domain}
                  onChange={(e) => setSourceForm({ ...sourceForm, domain: e.target.value })}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-700">اختر الفئات</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
                  {categories.length === 0 ? (
                    <p className="text-xs text-gray-400">لا توجد فئات متاحة</p>
                  ) : (
                    categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategoriesForSource.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategoriesForSource([...selectedCategoriesForSource, cat.id]);
                            } else {
                              setSelectedCategoriesForSource(selectedCategoriesForSource.filter(id => id !== cat.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsSourceModalOpen(false); setSelectedCategoriesForSource([]); }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <Button
                  onClick={handleCreateSource}
                  isLoading={isCreatingSource}
                  className="w-auto px-4 h-9 rounded-lg text-sm bg-purple-600 hover:bg-purple-700 text-white"
                >
                  حفظ المصدر
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
