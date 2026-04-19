import { useState } from "react";
import { useCategories } from "../hooks/useNews";
import { 
  Heart, 
  Laptop, 
  Scale, 
  Trophy, 
  Users, 
  LineChart, 
  Stethoscope, 
  Microscope, 
  Clapperboard, 
  GraduationCap, 
  Leaf,
  ArrowLeft,
  CheckCircle2,
  Tag
} from "lucide-react";
import Button from "./Button";

export default function OnboardingInterests({ onComplete, isLoading }) {
  const { data: categories = [] } = useCategories();
  
  const renderCategoryIcon = (key) => {
    switch (key) {
      case "technology": return Laptop;
      case "sports": return Trophy;
      case "politics": return Scale;
      case "health": return Stethoscope;
      case "economy": return LineChart;
      case "entertainment": return Clapperboard;
      case "science": return Microscope;
      case "education": return GraduationCap;
      case "environment": return Leaf;
      case "social": return Users;
      default: return Tag;
    }
  };
  const [selected, setSelected] = useState([]);

  const toggleInterest = (key) => {
    setSelected(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        {/* Header */}
        <div className="bg-linear-to-r from-teal-600 to-emerald-500 p-6 sm:p-8 text-white text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
            <Heart className="h-8 w-8 text-white fill-white/20" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">خصص تجربتك</h2>
          <p className="text-teal-50 text-sm sm:text-base opacity-90">
            اختر 3 مواضيع على الأقل لنقدم لك الأخبار التي تهمك
          </p>
        </div>

        {/* content */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-3 mb-8">
            {categories.map((category) => {
              const key = category.slug;
              const label = category.name;
              const Icon = renderCategoryIcon(key);
              const isActive = selected.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleInterest(key)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "border-teal-500 bg-teal-50/50 text-teal-700" 
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-teal-200"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? "bg-teal-500 text-white" : "bg-white text-gray-400 border border-gray-100"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm sm:text-base">{label}</span>
                  {isActive && <CheckCircle2 className="h-4 w-4 ms-auto text-teal-500" />}
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => onComplete(selected)}
            disabled={selected.length < 3 || isLoading}
            className="w-full py-4 text-lg font-bold rounded-2xl/20"
          >
            {isLoading ? "جارٍ الحفظ..." : "ابدأ استكشاف تريندي"}
            <ArrowLeft className="ms-2 h-5 w-5" />
          </Button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            يمكنك دائماً تعديل اهتماماتك من صفحتك الشخصية لاحقاً
          </p>
        </div>
      </div>
    </div>
  );
}
