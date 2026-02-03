export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password';

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  organizationName: string;
  password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyOtpData {
  otp: string;
}

export interface ResetPasswordData {
  newPassword: string;
  confirmPassword: string;
}
