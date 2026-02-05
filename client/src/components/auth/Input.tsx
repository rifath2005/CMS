import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', required, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-black text-[#001533] ml-0.5 tracking-wide uppercase opacity-70">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff7a00] transition-colors">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={`
            w-full py-2 rounded-xl border-2 bg-white transition-all outline-none font-medium text-sm
            ${icon ? 'pl-14' : 'px-4'}
            ${isPassword ? 'pr-14' : 'pr-4'}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-slate-100 focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 hover:border-slate-200'
            }
            ${className}
          `}
          required={required}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ff7a00] transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-500 font-medium ml-1 mt-0.5">{error}</span>}
    </div>
  );
};

export default Input;
