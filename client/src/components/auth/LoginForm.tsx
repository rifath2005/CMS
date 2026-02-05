import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Input from './Input';
import { LoginFormData } from '../../types/auth';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

interface LoginFormProps {
  onSwitchMode: (mode: 'signup' | 'forgot-password') => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchMode }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Clear error timeout on component unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Function to clear error after delay
  const clearErrorAfterDelay = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setError('');
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    setError('');
    setLoading(true);

    try {
      const authData = await authService.login(formData.email, formData.password);
      setAuth(authData);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Incorrect Credentials';

      if (err.response?.status === 401) {
        errorMessage = 'Incorrect Credentials';
      } else if (err.response?.status === 404) {
        errorMessage = 'Account not found';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = 'Connection error. Please check your internet connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      }

      setError(errorMessage);
      clearErrorAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); // Clear error when user types
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-left duration-500">
      <div className="flex flex-col items-center mb-1">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 bg-[#ff7a00] rounded-[14px] flex items-center justify-center shadow-lg shadow-[#ff7a00]/20">
             <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <span className="text-xl font-black tracking-tight text-[#001533]">NotinQ</span>
        </div>
        <h2 className="text-lg font-extrabold text-[#001533]">Welcome Back</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">Ready for faster food?</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-red-600 font-medium">{error}</span>
          <button
            type="button"
            onClick={() => {
              setError('');
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
            }}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <div className="space-y-2.5">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="yourname@domain.com"
          required
          icon={<Mail size={18} />}
          value={formData.email}
          onChange={handleChange}
        />

        <div className="flex flex-col">
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            icon={<Lock size={18} />}
            value={formData.password}
            onChange={handleChange}
          />
          <div className="flex justify-end">
            <button 
              type="button" 
              onClick={() => onSwitchMode('forgot-password')}
              className="text-xs font-bold text-[#ff7a00] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 w-full py-2.5 px-6 rounded-xl bg-[#ff7a00] text-white font-black text-sm tracking-widest shadow-lg shadow-[#ff7a00]/30 hover:bg-[#e66e00] hover:shadow-[#ff7a00]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : 'LOGIN'}
      </button>

      <div className="flex flex-col gap-2.5 mt-1">
        <div className="relative flex items-center py-0.5">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">OR</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/auth/google`}
          className="w-full py-1 px-6 rounded-xl bg-white border-2 border-slate-100 text-[#001533] font-bold text-sm transition-all hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs font-medium text-slate-600 mt-1">
          First time here?{' '}
          <button
            type="button"
            onClick={() => onSwitchMode('signup')}
            className="text-[#ff7a00] font-black hover:underline transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
