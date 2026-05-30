import { useState } from "react";
import { Input as AntInput } from "antd";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export function Input({ className = "", label, error, type = "text", showPasswordToggle = false, ...props }) {
    const [showPassword, setShowPassword] = useState(false);
    const isStringLabel = typeof label === "string";
    const hasRequiredMark = isStringLabel && label.includes("*");
    const baseLabel = isStringLabel ? label.replace("*", "").trim() : label;

    const isPasswordType = type === "password" && showPasswordToggle;
    const inputType = isPasswordType ? (showPassword ? "text" : "password") : type;

    return (
        <div className="space-y-1 w-full">
            {label && (
              <label className="text-[14px] font-medium text-[var(--color-text)]">
                <span>{baseLabel}</span>
                {hasRequiredMark && (
                  <span className="ml-0.5 text-[var(--color-danger)]">*</span>
                )}
              </label>
            )}
            <div className="relative w-full">
                <AntInput
                    type={inputType}
                    className={`w-full h-[47px] rounded-lg border border-slate-200 px-3 text-sm outline-none text-[var(--color-text)] ${isPasswordType ? 'pr-10' : ''} ${className}`}
                    {...props}
                />
                {isPasswordType && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        {showPassword ? (
                            <AiOutlineEyeInvisible size={20} />
                        ) : (
                            <AiOutlineEye size={20} />
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>
    );
}
