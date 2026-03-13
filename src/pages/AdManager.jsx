import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Megaphone, LayoutList, Trash2, Smartphone, Target, Settings, Zap } from 'lucide-react';
import Button from '../UI/Button';
import FormInput from '../UI/FormInput';
import FormSelect from '../UI/FormSelect';

export default function AdManager() {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adForm, setAdForm] = useState({
    title: '', description: '', cta_text: 'Shop Now',
    image_url: '', placement: 'FEED', userTier: 'free', region: ''
  });

  useEffect(() => { fetchAds(); }, []);

  async function fetchAds() {
    const { data, error } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
    if (!error && data) setAds(data);
  }

  const handleCreateAd = async () => {
    setIsLoading(true);
    const { error } = await supabase.from('advertisements').insert([{
      title: adForm.title || 'بدون عنوان',
      description: adForm.description,
      image_url: adForm.image_url,
      cta_text: adForm.cta_text,
      placement: adForm.placement,
      targeting_rules: { user_tier: adForm.userTier, region: adForm.region },
      is_active: true
    }]);
    setIsLoading(false);
    
    if (!error) {
      setAdForm({ title: '', description: '', cta_text: 'تسوق الآن', image_url: '', placement: 'FEED', userTier: 'free', region: '' });
      fetchAds();
    } else {
      alert('خطأ في إضافة الإعلان');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل ترغب في مسح هذه الحملة نهائياً؟")) return;
    await supabase.from('advertisements').delete().eq('id', id);
    fetchAds();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">إدارة الحملات الإعلانية</h1>
        <p className="text-gray-500 text-sm">قم بتكوين واستهداف الحملات الإعلانية الخاصة بك عبر المنصات.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        
        <div className="flex flex-col gap-6">
          {/* Ad Configuration Form */}
          <div className="bg-white rounded-[2rem] border border-red-50 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings size={20} className="text-teal-600"/> إعداد الإعلان
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-800 uppercase tracking-widest mb-2">عنوان الإعلان</label>
                <FormInput placeholder="مثال: تشكيلة صيف 2024" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-[11px] font-black text-gray-800 uppercase tracking-widest mb-2">الوصف</label>
                <textarea rows={3} className="w-full rounded-xl border border-gray-200 p-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 bg-gray-50/50 outline-none transition-colors" placeholder="تصفح أحدث الأزياء الموسمية بخصم 40%..." value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-[11px] font-black text-gray-800 uppercase tracking-widest mb-2">نص الزر</label>
                   <FormSelect value={adForm.cta_text} onChange={v => setAdForm({...adForm, cta_text: v})} options={[{label:'تسوق الآن', value:'تسوق الآن'}, {label:'عرض المزيد', value:'تعرف على المزيد'}, {label:'سجل مجاناً', value:'سجل مجاناً'}]} />
                </div>
                <div>
                   <label className="block text-[11px] font-black text-gray-800 uppercase tracking-widest mb-2">رابط الصورة</label>
                   <FormInput placeholder="https://..." value={adForm.image_url} onChange={e => setAdForm({...adForm, image_url: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* Targeting Conditions */}
          <div className="bg-white rounded-[2rem] border p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target size={20} className="text-teal-600"/> شروط الاستهداف
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">موقع الظهور</label>
                <FormSelect value={adForm.placement} onChange={v => setAdForm({...adForm, placement: v})} options={[{label:'الخلاصة', value:'FEED'}, {label:'تفاصيل الخبر', value:'NEWS_DETAIL'}, {label:'الشريط الجانبي', value:'SIDEBAR'}]} />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">فلتر المستخدمين</label>
                <FormSelect value={adForm.userTier} onChange={v => setAdForm({...adForm, userTier: v})} options={[{label:'المستخدم الفري', value:'free'}, {label:'المشتركين', value:'premium'}]} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">المنطقة الجغرافية</label>
                <FormInput placeholder="مثال: مصر، دبي، أوروبا..." value={adForm.region} onChange={e => setAdForm({...adForm, region: e.target.value})} />
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
               <Button onClick={handleCreateAd} isLoading={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white px-8 h-12 rounded-xl text-sm">
                  إطلاق الحملة الإعلانية
               </Button>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="bg-white rounded-[2rem] border p-6 md:p-8">
             <div className="flex items-center justify-between mb-6 pb-4 border-b">
               <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                 <Zap size={20} className="text-teal-600"/> الحملات النشطة
               </h2>
               <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-bold">المجموع: {ads.length}</span>
             </div>
             
             <div className="divide-y space-y-4">
               {ads.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">لا يوجد أي إعلان نشط حالياً</p> : null}
               {ads.map(ad => (
                 <div key={ad.id} className="pt-4 flex justify-between items-center group">
                   <div>
                     <p className="font-bold text-gray-900 mb-0.5">{ad.title}</p>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-2 flex py-0.5 rounded-full font-bold">{ad.placement}</span>
                        <span className="text-[10px] text-gray-400">انطباعات: {ad.impressions_count || 0}</span>
                     </div>
                   </div>
                   <button onClick={() => handleDelete(ad.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                     <Trash2 size={18}/>
                   </button>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Live Preview Panel - iPhone Mockup */}
        <div className="lg:sticky lg:top-[88px] flex flex-col gap-6">
          <div className="bg-teal-50/50 rounded-[2rem] p-6 border border-teal-100 relative overflow-hidden">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Smartphone size={18} className="text-teal-600"/> المعاينة الحية
            </h3>
            
            {/* The Phone Container */}
            <div className="bg-gray-900 mx-auto rounded-[3rem] border-[8px] border-gray-900 overflow-hidden h-[540px] flex flex-col relative w-[260px]">
              {/* Dynamic Island Mockup */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20"></div>
              
              {/* App Fake Header */}
              <div className="h-16 bg-gray-50 flex items-end px-5 pb-3 gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div className="flex-1 h-3 bg-gray-200 rounded-full"></div>
              </div>
              
              {/* App Feed Scroller */}
              <div className="p-4 flex-1 overflow-y-auto bg-gray-100 no-scrollbar">
                
                {/* The Mock Ad Component */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden pb-4 transform transition-all duration-300 hover:scale-[1.02]">
                  {adForm.image_url ? (
                    <img src={adForm.image_url} alt="Cover" className="w-full h-36 object-cover bg-gray-100" onError={(e) => e.target.src = 'https://placehold.co/400x300/eaeaea/999?text=Cover+Image'} />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-tr from-purple-100 to-fuchsia-100 flex items-center justify-center">
                       <span className="text-xs text-teal-400 font-bold tracking-widest uppercase bg-white px-2 py-1 rounded">SPONSORED</span>
                    </div>
                  )}
                  <div className="px-4 pt-3 text-start">
                    <h4 className="font-bold text-gray-900 text-[15px] leading-tight mb-1">{adForm.title || 'عنوان الحملة الإعلانية'}</h4>
                    <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{adForm.description || 'اكتب وصف جذاب لحملتك لزيادة فرص النقرات والتحويل...'}</p>
                    <button className="w-full bg-teal-600 text-white rounded-xl py-2.5 text-[12px] font-bold">{adForm.cta_text || 'عرض التفاصيل'}</button>
                  </div>
                </div>

                {/* Fake Content Below */}
                <div className="mt-4 bg-white rounded-2xl p-4 opacity-50">
                   <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                   <div className="h-24 w-full bg-gray-100 rounded"></div>
                </div>
              </div>
              
              {/* Fake Bottom Nav */}
              <div className="h-14 bg-white border-t border-gray-100 flex items-center justify-evenly shrink-0">
                 <div className="w-5 h-5 rounded bg-gray-300"></div>
                 <div className="w-5 h-5 rounded bg-teal-600"></div>
                 <div className="w-5 h-5 rounded bg-gray-300"></div>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-gray-400 mt-6 italic px-4">
              Preview represents how the ad will appear in the main feed on mobile devices.
            </p>
          </div>

          <div className="bg-teal-50 rounded-2xl p-6 text-teal-900 border border-teal-100">
            <h4 className="font-bold text-sm mb-2 opacity-80 flex items-center gap-2">💡 Pro Tip</h4>
            <p className="text-xs leading-relaxed opacity-70">
              الحملات التي تستهدف "المستخدمين العاديين" تحقق عادة نسبة نقر (CTR) أعلى بـ 15% عند وضع زر بصيغة مباشرة وواضحة مثل "تسوق الآن".
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
