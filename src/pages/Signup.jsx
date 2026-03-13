import { useForm, Controller } from "react-hook-form";
import { ArrowLeft, Mail, Lock, User, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../UI/AuthLayout";
import FormInput from "../UI/FormInput";
import FormSelect from "../UI/FormSelect";
import Button from "../UI/Button";
import { EGYPT_GOVERNORATES } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";

export default function SignUp() {
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const { signup, signupLoading } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      location: "",
    },
  });

  async function onSubmit(data) {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        location: data.location,
        interests: [], // Set to empty initially to trigger onboarding modal after login
      });

      // After successful signup, redirect to login so they can authenticate
      // and then see the onboarding interests modal
      setSuccessMsg(
        "تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول لتخصيص اهتماماتك.",
      );
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setErrorMsg(
        err?.message === "User already registered"
          ? "هذا البريد الإلكتروني مسجل بالفعل"
          : err?.message || "حدث خطأ أثناء إنشاء الحساب",
      );
    }
  }

  return (
    <AuthLayout
      title="إنشاء حساب"
      subtitle="انضم إلى Trendy للتحقق من الأخبار في الوقت الفعلي باستخدام الذكاء الاصطناعي."
    >
      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 text-center">
          {successMsg}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
        {/* Full Name */}
        <FormInput
          icon={User}
          placeholder="الاسم الكامل"
          error={errors.fullName}
          register={register("fullName", {
            required: "الاسم الكامل مطلوب",
            minLength: {
              value: 3,
              message: "الاسم يجب أن يكون 3 أحرف على الأقل",
            },
          })}
        />

        {/* Email */}
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

        {/* Password */}
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

        {/* Phone — Egyptian number */}
        <FormInput
          icon={Phone}
          type="tel"
          prefix="+20"
          placeholder="1XXXXXXXXX"
          error={errors.phone}
          register={register("phone", {
            required: "رقم الهاتف مطلوب",
            pattern: {
              value: /^1[0125]\d{8}$/,
              message: "أدخل رقم هاتف مصري صحيح",
            },
          })}
        />

        {/* Location — Egypt governorates */}
        <Controller
          name="location"
          control={control}
          rules={{ required: "الموقع مطلوب" }}
          render={({ field: { value, onChange, name } }) => (
            <FormSelect
              icon={MapPin}
              placeholder="اختر المحافظة"
              options={EGYPT_GOVERNORATES}
              error={errors.location}
              name={name}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <Button
          type="submit"
          isLoading={signupLoading}
          className="cursor-pointer"
        >
          إنشاء حساب
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </form>

      {/* Link to login */}
      <p className="text-center text-sm text-text-secondary mb-6">
        لديك حساب بالفعل؟{" "}
        <Link
          to="/login"
          className="text-accent-cyan hover:underline transition"
        >
          تسجيل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
}
