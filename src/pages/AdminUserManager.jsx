import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, Plus, ShieldAlert, CheckCircle2, Search } from 'lucide-react';
import Button from '../UI/Button';
import FormInput from '../UI/FormInput';
import FormSelect from '../UI/FormSelect';

export default function AdminUserManager() {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchAdmins(); }, []);

  async function fetchAdmins() {
    const { data, error } = await supabase.from('users').select('*').neq('role', 'USER');
    if (!error && data) {
      setAdmins(data);
      if (!selectedAdmin && data.length > 0) setSelectedAdmin(data[0]);
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsLoading(true);
    const { data: userData, error: findError } = await supabase.from('users').select('id').eq('email', inviteEmail).single();
    
    if (userData && !findError) {
      await supabase.from('users').update({ role: inviteRole }).eq('id', userData.id);
      alert('تمت ترقية العضو وتعيينه כمسؤول بنجاح!');
      setInviteEmail('');
      fetchAdmins();
    } else {
      alert('لم يتم العثور على حساب بهذا البريد الإلكتروني في النظام.');
    }
    setIsLoading(false);
  };

  const handleSuspend = async (id) => {
     if (!window.confirm("هل أنت متأكد من تعليق وصول هذا المسؤول؟")) return;
     await supabase.from('users').update({ status: 'SUSPENDED' }).eq('id', id);
     fetchAdmins();
  };

  const togglePermission = async (key) => {
    if (!selectedAdmin) return;
    const currentPerms = selectedAdmin.admin_permissions || {};
    const newPerms = { ...currentPerms, [key]: !currentPerms[key] };
    
    setSelectedAdmin({ ...selectedAdmin, admin_permissions: newPerms });
    setAdmins(admins.map(a => a.id === selectedAdmin.id ? { ...a, admin_permissions: newPerms } : a));

    await supabase.from('users').update({ admin_permissions: newPerms }).eq('id', selectedAdmin.id);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">إدارة الفريق والصلاحيات</h1>
          <p className="text-gray-500 text-sm">تحكم في هوية المسؤولين ومستويات الوصول للمنصة.</p>
        </div>
      </div>

      {/* Quick Invite Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">دعوة سريعة (ترقية)</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
            <FormInput placeholder="admin@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          </div>
          <div className="md:col-span-4">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">الدور المبدئي</label>
            <FormSelect value={inviteRole} onChange={setInviteRole} options={[{label:'مسؤول شامل (Super)', value:'SUPER_ADMIN'}, {label:'مدير النظام', value:'ADMIN'}, {label:'محرر (Editor)', value:'EDITOR'}, {label:'مشرف (Moderator)', value:'MODERATOR'}]} />
          </div>
          <div className="md:col-span-3">
            <Button isLoading={isLoading} onClick={handleInvite} className="bg-teal-100/50 text-teal-700 hover:bg-teal-100 w-full rounded-xl py-3 font-bold border-0 h-[42px]">
              إرسال الدعوة
            </Button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 pt-2">دليل الفريق (المديرين)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map(admin => (
          <div 
            key={admin.id} 
            onClick={() => setSelectedAdmin(admin)} 
            className={`bg-white rounded-[2rem] p-6 cursor-pointer outline-none transition-all ${
              selectedAdmin?.id === admin.id 
                ? 'ring-2 ring-teal-600 border-transparent' 
                : 'border border-gray-100 hover:border-teal-200'
            }`}
          >
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center font-bold text-xl border border-teal-100">
                   {admin.full_name?.[0] || '?'}
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">{admin.full_name || 'بدون اسم'}</h3>
                   <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{admin.role}</span>
                 </div>
               </div>
               {selectedAdmin?.id === admin.id && (
                 <span className="text-[10px] font-bold text-teal-600">Selected</span>
               )}
             </div>
             
             <div className="space-y-3">
                <Button 
                  onClick={(e) => { e.stopPropagation(); setSelectedAdmin(admin); }} 
                  className={selectedAdmin?.id === admin.id ? "bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-0 rounded-xl py-3 font-bold"}
                >
                  تعديل الصلاحيات
                </Button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSuspend(admin.id); }} 
                  className="w-full text-center text-sm font-bold text-red-500 hover:text-red-600 pt-2 pb-1"
                >
                  تعليق الوصول
                </button>
             </div>
          </div>
        ))}
      </div>

      {selectedAdmin && (
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden mt-6 flex flex-col md:flex-row">
          <div className="flex-1 p-6 md:p-8 border-e border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-gray-900">مصفوفة الصلاحيات الخاصة</h3>
              <span className="text-xs font-bold text-teal-600">المستخدم: {selectedAdmin.full_name}</span>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">إدارة الإعلانات (Manage Ads)</h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm">الوصول الكامل إلى حملات الإعلان وبيانات الأداء والتعديل عليها.</p>
                </div>
                <button onClick={() => togglePermission('can_manage_ads')} className={`w-14 h-8 rounded-full transition-colors relative flex items-center shrink-0 ${selectedAdmin.admin_permissions?.can_manage_ads ? 'bg-teal-600' : 'bg-gray-200'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute transition-all ${selectedAdmin.admin_permissions?.can_manage_ads ? 'left-1' : 'right-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">إدارة المصادر (Manage Sources)</h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm">إضافة أو إزالة مصادر البيانات والتحكم في إعدادات المنصة الموثوقة.</p>
                </div>
                <button onClick={() => togglePermission('can_manage_sources')} className={`w-14 h-8 rounded-full transition-colors relative flex items-center shrink-0 ${selectedAdmin.admin_permissions?.can_manage_sources ? 'bg-teal-600' : 'bg-gray-200'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute transition-all ${selectedAdmin.admin_permissions?.can_manage_sources ? 'left-1' : 'right-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">تعديل المحتوى (Edit Content)</h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm">تعديل الصفحات الرئيسية، المراجعات، ومقالات المدونة الموثقة.</p>
                </div>
                <button onClick={() => togglePermission('can_edit_content')} className={`w-14 h-8 rounded-full transition-colors relative flex items-center shrink-0 ${selectedAdmin.admin_permissions?.can_edit_content ? 'bg-teal-600' : 'bg-gray-200'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute transition-all ${selectedAdmin.admin_permissions?.can_edit_content ? 'left-1' : 'right-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
