export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-100 via-gray-50 to-white px-3 sm:px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 shadow-xl">
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
