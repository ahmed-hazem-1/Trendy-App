export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-3 sm:px-4 relative overflow-hidden">
      {/* Animated Mesh Gradient Waves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Wave 1: Teal */}
        <div className="absolute -top-[20%] -start-[10%] w-[120%] h-[120%] bg-linear-to-br from-teal-200/40 via-transparent to-emerald-200/30 rounded-[45%] animate-wave-slow mix-blend-multiply" />
        
        {/* Wave 2: Blue (Reverse) */}
        <div className="absolute -bottom-[20%] -end-[10%] w-[130%] h-[130%] bg-linear-to-tr from-blue-200/30 via-transparent to-cyan-100/20 rounded-[40%] animate-wave-reverse mix-blend-screen opacity-60" />

        {/* Wave 3: Emerald Accent */}
        <div className="absolute top-[30%] left-[20%] w-[100%] h-[100%] bg-linear-to-r from-emerald-100/20 to-teal-100/10 rounded-[50%] animate-wave-slow animation-delay-4000 opacity-50" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-gray-200/50 bg-white/70 p-5 sm:p-8 backdrop-blur-xl relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img
            src="/logo/Trendy - logo - with text.png"
            alt="Trendy"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {title}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8 max-w-xs mx-auto leading-relaxed">
          {subtitle}
        </p>

        {children}

        {/* Terms */}
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          بالمتابعة، فإنك توافق على{" "}
          <a href="#" className="text-gray-500 hover:text-gray-700 transition">
            شروط الخدمة
          </a>{" "}
          و{" "}
          <a href="#" className="text-gray-500 hover:text-gray-700 transition">
            سياسة الخصوصية
          </a>
          .
        </p>
      </div>
    </main>
  );
}
