import { useState } from 'react';
import { Clock, Coffee } from 'lucide-react';
import { AuthMode } from '../types/auth';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import VerifyOtpForm from '../components/auth/VerifyOtpForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

const Login = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleModeSwitch = (newMode: AuthMode) => setMode(newMode);
  
  const handleEmailSubmit = (email: string) => setResetEmail(email);
  
  const handleTokenReceived = (token: string) => setResetToken(token);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Brand Story Panel - Left (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] p-6 bg-[#001533] text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-[#ff7a00] rounded-[12px] flex items-center justify-center shadow-lg shadow-[#ff7a00]/20">
               <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="text-xl font-black tracking-tight">NotinQ</span>
          </div>
          
          <div className="space-y-3">
            <span className="text-[#ff7a00] font-black tracking-widest text-xs uppercase">THE PROBLEM WE SOLVE</span>
            <h1 className="text-5xl font-black leading-[1.1] mb-6 tracking-tighter">
              Goodbye <br />
              <span className="text-blue-400/40">Long</span> <br />
              Queues.
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-sm leading-relaxed">
              We built NotinQ because no one should spend their lunch break waiting in line. 
            </p>
          </div>
        </div>

        <div className="space-y-4 relative z-10 pb-2">
          <div className="group flex items-start gap-4 p-3 rounded-2xl transition-colors hover:bg-white/5 cursor-default">
            <div className="p-2.5 bg-white/5 rounded-xl text-[#ff7a00] group-hover:bg-[#ff7a00] group-hover:text-white transition-all"><Clock size={20} /></div>
            <div>
              <h3 className="font-extrabold text-white text-base">Save 20+ Minutes</h3>
              <p className="text-xs text-slate-500 font-medium">Pre-order your meals and pick them up instantly.</p>
            </div>
          </div>
          <div className="group flex items-start gap-4 p-3 rounded-2xl transition-colors hover:bg-white/5 cursor-default">
            <div className="p-2.5 bg-white/5 rounded-xl text-[#ff7a00] group-hover:bg-[#ff7a00] group-hover:text-white transition-all"><Coffee size={20} /></div>
            <div>
              <h3 className="font-extrabold text-white text-base">Smart Canteen</h3>
              <p className="text-xs text-slate-500 font-medium">Real-time menu updates and availability tracking.</p>
            </div>
          </div>
        </div>

        {/* Food Items Decoration */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-10 text-6xl rotate-12">🍕</div>
          <div className="absolute top-32 left-8 text-5xl -rotate-12">🧃</div>
          <div className="absolute top-1/3 right-16 text-7xl rotate-6">🍔</div>
          <div className="absolute top-1/2 left-12 text-5xl -rotate-6">☕</div>
          <div className="absolute bottom-40 left-16 text-6xl rotate-12">🥪</div>
          <div className="absolute bottom-32 right-12 text-5xl -rotate-12">🥤</div>
          <div className="absolute top-2/3 left-1/3 text-5xl rotate-45">🍩</div>
          <div className="absolute top-1/4 left-1/2 text-5xl -rotate-12">🌮</div>
          <div className="absolute bottom-1/4 right-8 text-5xl rotate-6">🍟</div>
        </div>

        {/* Abstract subtle decoration */}
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#ff7a00]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] left-[-20%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Form Content Area */}
      <main className="flex-1 flex items-center justify-center p-3 md:p-6 relative bg-[#fafafa] overflow-y-auto">
        {/* Back to Landing Page Button */}
        <a 
          href="http://localhost:5174" 
          className="absolute top-3 left-3 md:top-4 md:left-4 z-50 flex items-center gap-2 text-slate-600 hover:text-[#ff7a00] transition-colors font-semibold text-sm group bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </a>
        
        <div className={`w-full max-w-[500px] glass-card rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-4 md:p-6 transition-all duration-700 transform my-auto ${mode === 'signup' ? 'md:max-w-[760px]' : ''}`}>
          {mode === 'login' && <LoginForm key="login-form" onSwitchMode={handleModeSwitch} />}
          {mode === 'signup' && <SignupForm key="signup-form" onSwitchMode={handleModeSwitch} />}
          {mode === 'forgot-password' && <ForgotPasswordForm key="forgot-form" onSwitchMode={handleModeSwitch} onEmailSubmit={handleEmailSubmit} />}
          {mode === 'verify-otp' && <VerifyOtpForm key="verify-form" email={resetEmail} onSwitchMode={handleModeSwitch} onTokenReceived={handleTokenReceived} />}
          {mode === 'reset-password' && <ResetPasswordForm key="reset-form" email={resetEmail} resetToken={resetToken} onSwitchMode={handleModeSwitch} />}
        </div>
      </main>

      {/* Mobile Footer */}
      <footer className="lg:hidden p-2 text-center bg-white">
        <div className="flex justify-center items-center gap-2 mb-1">
           <div className="w-5 h-5 bg-[#ff7a00] rounded-lg flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
           </div>
           <span className="font-black text-[#001533] text-sm">NotinQ</span>
        </div>
        <p className="text-slate-400 text-[9px] font-bold tracking-widest uppercase">&copy; {new Date().getFullYear()} NotinQ Technologies Inc.</p>
      </footer>
    </div>
  );
};

export default Login;
