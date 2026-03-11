import { useForm } from "react-hook-form";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import AuthLayout from "../UI/AuthLayout";
import FormInput from "../UI/FormInput";
import Button from "../UI/Button";
import { useAuth } from "../hooks/useAuth";
import { setDemoMode } from "../store/authSlice";

export default function Login() {
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { login, loginLoading, isAuthenticated } = useAuth();
  const from = location.state?.from?.pathname || "/feed";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // If already authenticated, redirect (must be after all hooks)
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(data) {
    setErrorMsg("");
    try {
      await login({ email: data.email, password: data.password });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.message || "";
      if (msg === "Invalid login credentials") {
        setErrorMsg("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (msg.includes("Email not confirmed")) {
        setErrorMsg(
          "لم يتم تأكيد بريدك الإلكتروني بعد. تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها وقم بتأكيد حسابك أولاً.",
        );
      } else {
        setErrorMsg(msg || "حدث خطأ أثناء تسجيل الدخول");
      }
    }
  }

  function handleDemoLogin() {
    setErrorMsg("");
    dispatch(setDemoMode(true));
    navigate("/feed", { replace: true });
  }

  return (
    <AuthLayout
      title="مرحباً بك في Trendy"
      subtitle="مصدرك الموثوق للتحقق من الأخبار في الوقت الفعلي باستخدام الذكاء الاصطناعي."
    >
      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-5">
        <FormInput
          icon={Mail}
          type="email"
          placeholder="البريد الإلكتروني"
          error={errors.email}
          register={register("email", {
            required: "البريد الإلكتروني مطلوب",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "أدخل بريد إلكتروني صحيح",
            },
          })}
        />

        <FormInput
          icon={Lock}
          type="password"
          placeholder="كلمة المرور"
          error={errors.password}
          register={register("password", {
            required: "كلمة المرور مطلوبة",
            minLength: {
              value: 6,
              message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
            },
          })}
        />

        <Button
          type="submit"
          isLoading={loginLoading}
          className="cursor-pointer"
        >
          تسجيل الدخول
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        onClick={handleDemoLogin}
        isLoading={loginLoading}
        className="mb-6 cursor-pointer"
      >
        المتابعة بحساب تجريبي
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <p className="text-center text-sm text-text-secondary mb-6">
        ليس لديك حساب؟{" "}
        <Link
          to="/signup"
          className="text-accent-cyan hover:underline transition"
        >
          إنشاء حساب
        </Link>
      </p>
    </AuthLayout>
  );
}
