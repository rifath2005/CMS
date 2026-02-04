import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', required, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-black text-[#001533] ml-0.5 tracking-wide uppercase opacity-70">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff7a00] transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full py-2 rounded-xl border-2 bg-white transition-all outline-none font-medium text-sm
            ${icon ? 'pl-10 pr-3' : 'px-3'}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-slate-100 focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 hover:border-slate-200'
            }
            ${className}
          `}
          required={required}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 font-medium ml-1 mt-0.5">{error}</span>}
    </div>
  );
};

export default Input;
