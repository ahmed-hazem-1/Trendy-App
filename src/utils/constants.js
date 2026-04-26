const EGYPT_GOVERNORATES = [
  { value: "cairo", label: "القاهرة" },
  { value: "giza", label: "الجيزة" },
  { value: "alexandria", label: "الإسكندرية" },
  { value: "dakahlia", label: "الدقهلية" },
  { value: "red-sea", label: "البحر الأحمر" },
  { value: "beheira", label: "البحيرة" },
  { value: "fayoum", label: "الفيوم" },
  { value: "gharbiya", label: "الغربية" },
  { value: "ismailia", label: "الإسماعيلية" },
  { value: "menofia", label: "المنوفية" },
  { value: "minya", label: "المنيا" },
  { value: "qaliubiya", label: "القليوبية" },
  { value: "new-valley", label: "الوادي الجديد" },
  { value: "suez", label: "السويس" },
  { value: "aswan", label: "أسوان" },
  { value: "assiut", label: "أسيوط" },
  { value: "beni-suef", label: "بني سويف" },
  { value: "port-said", label: "بورسعيد" },
  { value: "damietta", label: "دمياط" },
  { value: "sharkia", label: "الشرقية" },
  { value: "south-sinai", label: "جنوب سيناء" },
  { value: "kafr-el-sheikh", label: "كفر الشيخ" },
  { value: "matrouh", label: "مطروح" },
  { value: "luxor", label: "الأقصر" },
  { value: "qena", label: "قنا" },
  { value: "north-sinai", label: "شمال سيناء" },
  { value: "sohag", label: "سوهاج" },
];

const MOCK_NEWS = [
  {
    id: 1,
    title:
      "التحقيق فى واقعة تعدى موظفة بمديرية الزراعة بالغربية على زميلها بالضرب - اليوم السابع",
    content:
      "التحقيق فى واقعة تعدى موظفة بمديرية الزراعة بالغربية على زميلها بالضرب - اليوم السابع",
    verification_status: "UNVERIFIED",
    credibility_score: 90,
    reasoning:
      '"الأدلة المقدمة لا تؤكد بشكل مباشر تفاصيل الحادث المذكور في المقال من حيث مكان وقوته بمديرية الزراعة بالغربية، أو أطرافه المحددة (موظفة تعتدي على زميلها)...لا تملك الإدلة والوقائف على المعلش اهذا الحادث باستثناء الأدلة عامة لا تشير إلى الحوادث الحديثة لتحوّل مماثل."',
    timeAgo: "منذ ساعة",
    category: "عام",
    comments: 0,
    likes: 0,
    dislikes: 0,
  },
  {
    id: 2,
    title: "موعد الإفطار وصلاة التراويح سادس أيام رمضان 2026 - اليوم السابع",
    content: "موعد الإفطار وصلاة التراويح سادس أيام رمضان 2026 - اليوم السابع",
    verification_status: "FAKE",
    credibility_score: 95,
    reasoning:
      '"رغم المقال أن يوم الثلاثاء 24 فبراير 2026 هو اليوم السادس من رمضان 2026، وهي ذلك نتيجة المصادر الموثوقة إلى أن رمضان 2026 من المتوقع أن يبدأ في 18 فبراير 2026 (اليوم الأول)..."',
    timeAgo: "منذ ساعة",
    category: "عام",
    comments: 0,
    likes: 0,
    dislikes: 0,
  },
  {
    id: 3,
    title:
      '"سيكون مختلفاً".. تحذيرات من رد إيران على الضربات الأمريكية - سكاي نيوز عربية',
    content:
      '"سيكون مختلفاً".. تحذيرات من رد إيران على الضربات الأمريكية - سكاي نيوز عربية',
    verification_status: "VERIFIED",
    credibility_score: 100,
    reasoning:
      '"جميع الادعاءات الواردة في المقال يتم في ذلك تحذيرات إيران من رد فعل مختلف وغير محدود على الضربات الأمريكية..."',
    timeAgo: "منذ ساعة",
    category: "عام",
    comments: 0,
    likes: 0,
    dislikes: 0,
  },
];

const MOCK_TRENDING = [
  {
    id: 1,
    title:
      "التحقيق فى واقعة تعدى موظفة بمديرية الزراعة بالغربية على زميلها بالضرب...",
    verification_status: "UNVERIFIED",
    credibility_score: 90,
  },
  {
    id: 2,
    title: "موعد الإفطار وصلاة التراويح سادس أيام رمضان 2026 - اليوم السابع",
    verification_status: "FAKE",
    credibility_score: 95,
  },
  {
    id: 3,
    title:
      '"سيكون مختلفاً".. تحذيرات من رد إيران على الضربات الأمريكية - سكاي نيوز عربية',
    verification_status: "VERIFIED",
    credibility_score: 100,
  },
  {
    id: 4,
    title: "محمد صلاح يكتب التاريخ في أسبع وصول إلى 100 هدف بالدوري الإنجليزي",
    verification_status: "FAKE",
    credibility_score: 100,
  },
  {
    id: 5,
    title: 'ترامب يسعى لإنقاذ الأغلبية الجمهورية والهشة في خطاب "حال الإتحاد"',
    verification_status: "VERIFIED",
    credibility_score: 90,
  },
];

const MOCK_STATS = {
  total: 284,
  verified: 147,
  fake: 20,
  unverified: 64,
  avgConfidence: 91,
};

export { EGYPT_GOVERNORATES, MOCK_NEWS, MOCK_TRENDING, MOCK_STATS };
