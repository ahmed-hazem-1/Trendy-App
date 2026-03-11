export default function FormInput({
  icon: Icon,
  type = "text",
  placeholder,
  prefix,
  error,
  register,
}) {
  return (
    <div>
      <div className="relative">
        {Icon && !prefix && (
          <Icon className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
        {prefix && (
          <span className="absolute inset-s-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm text-gray-400">
            {Icon && <Icon className="h-4 w-4" />}
            <span>{prefix}</span>
            <span className="h-4 w-px bg-gray-200" />
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-gray-50 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none ring-0 transition focus:border-teal-400 focus:ring-1 focus:ring-teal-200 ${prefix ? "ps-20 pe-4" : Icon ? "ps-10 pe-4" : "px-4"} ${error ? "border-red-400" : "border-gray-200"}`}
          {...register}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
