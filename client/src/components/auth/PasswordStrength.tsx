import React, { useMemo } from 'react';
import { PasswordStrength as StrengthType } from '../../types/auth';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const strength: StrengthType = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };

    let score = 0;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-yellow-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-green-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200' };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-1 w-full px-1">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-500">
        <span>Strength</span>
        <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
      </div>
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`flex-1 rounded-full transition-all duration-300 ${
              step <= strength.score ? strength.color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <ul className="mt-2 text-[10px] grid grid-cols-2 gap-x-4 text-slate-400">
        <li className={`${password.length > 7 ? 'text-green-600' : ''}`}>• 8+ characters</li>
        <li className={`${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>• Uppercase</li>
        <li className={`${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>• Number</li>
        <li className={`${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}`}>• Symbol</li>
      </ul>
    </div>
  );
};

export default PasswordStrength;
