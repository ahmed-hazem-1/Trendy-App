import React from 'react';
import benhaLogo from '../images/benha_university_logo.png';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm p-8 sm:p-12 text-center my-4">
      <div className="flex items-center justify-center mb-10 gap-8 sm:gap-12">
        <img
          src="/logo/Trendy - logo - with text.png"
          alt="Trendy Logo"
          className="h-12 sm:h-20 w-auto object-contain"
        />
        <div className="h-12 sm:h-20 w-px bg-gray-200" />
        <img
          src={benhaLogo}
          alt="شعار جامعة بنها"
          className="h-12 sm:h-20 w-auto object-contain"
        />
      </div>
      
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">عن التطبيق</h1>
      
      <div className="space-y-6 text-gray-700 leading-loose text-lg text-justify" dir="rtl">
        <p>
          تطبيق <strong>Trendy</strong> هو منصة إخبارية متكاملة تقدم أحدث الأخبار والمقالات في مختلف المجالات، 
          مما يتيح للمستخدمين البقاء على اطلاع دائم بكل ما هو جديد وبسرعة فائقة.
        </p>
        <p>
          تم تطوير هذا التطبيق بفخر كجزء من مشروع تخرج بواسطة طلاب <strong>قسم الإعلام بكلية الآداب - جامعة بنها</strong>. 
          وهو ثمرة جهد جماعي يهدف إلى دمج مهارات الإعلام الحديث مع أحدث تقنيات التطوير الرقمي.
        </p>
        <p>
          يهدف التطبيق إلى تقديم تجربة مستخدم متميزة للحصول على الأخبار الموثوقة بطريقة عصرية، 
          تعتمد على واجهة مستخدم بديهية وتصميم مرن يلبي تطلعات واحتياجات المستخدم العربي المعاصر.
        </p>
        <p>
          نحن في فريق التطوير نفخر بكوننا جزءاً من جامعة بنها العريقة، ونطمح لأن يكون هذا التطبيق إضافة قيمة للمجتمع الرقمي والإعلامي في مصر والوطن العربي.
        </p>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100 text-sm text-gray-500">
        <p className="mb-2">كلية الآداب - قسم الإعلام - جامعة بنها</p>
        <p>&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
