export default function SplashScreen() {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-slate-100 via-gray-50 to-white transition-opacity duration-700`}
    >
      <img
        src="/logo/Trendy - GIF.gif"
        alt="Trendy"
        className="w-40 h-40 object-contain"
      />
    </div>
  );
}
