import benhaLogo from "../images/benha_university_logo.png";

export default function SplashScreen() {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-slate-100 via-gray-50 to-white transition-opacity duration-700`}
    >
      <div className="flex items-center gap-8 animate-in fade-in zoom-in duration-500">
        <img
          src="/logo/Trendy - GIF.gif"
          alt="Trendy"
          className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
        />
        <div className="h-16 w-px bg-gray-200" />
        <img
          src={benhaLogo}
          alt="جامعة بنها"
          className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-pulse"
        />
      </div>
    </div>
  );
}
