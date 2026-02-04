# Landing Page & Login Integration Plan

## Overview
Integrate the separate LandingPage-CMS and notinq---canteen-management apps into the main CMS project.

## Current Structure
```
├── LandingPage-CMS/          # Separate app on localhost:3001
├── notinq---canteen-management/  # Separate app with login/signup
└── CMS/
    └── client/
        └── src/
            └── pages/
                └── Login.tsx  # Current simple login page
```

## Integration Goals
1. **Landing Page** → Root route (`/`)
2. **Login/Signup** → Replace current `Login.tsx` with notinq design
3. **Workflow**: Landing Page "Login" button → NotinQ Login Page → Dashboard

## Implementation Steps

### Step 1: Copy Components to CMS
Copy all notinq components into CMS project:
```
CMS/client/src/components/auth/
├── LoginForm.tsx
├── SignupForm.tsx
├── ForgotPasswordForm.tsx
├── VerifyOtpForm.tsx
├── ResetPasswordForm.tsx
├── Input.tsx
└── PasswordStrength.tsx
```

### Step 2: Create Landing Page Component
Create `CMS/client/src/pages/LandingPage.tsx` with:
- Hero section
- Features section
- Story section
- Contact form
- Navigation to `/login`

### Step 3: Update Login Page
Replace `CMS/client/src/pages/Login.tsx` with notinq design:
- Use LoginForm, SignupForm components
- Integrate with existing authService
- Maintain current authentication flow
- Remove hardcoded localhost links

### Step 4: Update Routing
Modify `CMS/client/src/App.tsx`:
```tsx
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<Login />} />
// ... existing protected routes
```

### Step 5: Copy Assets & Styles
- Copy images from LandingPage-CMS to `CMS/client/public/`
- Copy any custom CSS/animations
- Ensure Tailwind config includes all needed classes

### Step 6: Update Navigation
- Landing page "Login" button → `/login`
- Remove all `localhost:3001` and `localhost:3000` references
- Use React Router `<Link>` or `navigate()`

## Files to Modify

### New Files
1. `CMS/client/src/pages/LandingPage.tsx`
2. `CMS/client/src/components/auth/LoginForm.tsx`
3. `CMS/client/src/components/auth/SignupForm.tsx`
4. `CMS/client/src/components/auth/ForgotPasswordForm.tsx`
5. `CMS/client/src/components/auth/VerifyOtpForm.tsx`
6. `CMS/client/src/components/auth/ResetPasswordForm.tsx`
7. `CMS/client/src/components/auth/Input.tsx`
8. `CMS/client/src/components/auth/PasswordStrength.tsx`
9. `CMS/client/src/types/auth.ts` (for auth-specific types)

### Modified Files
1. `CMS/client/src/App.tsx` - Add landing page route
2. `CMS/client/src/pages/Login.tsx` - Replace with notinq design
3. `CMS/client/tailwind.config.js` - Add custom animations if needed

## Authentication Integration

### Current Flow (Keep This)
```
Login → authService.login() → setAuth() → navigate('/dashboard')
```

### Update LoginForm.tsx
Replace the mock `handleSubmit` with:
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const authData = await authService.login(formData.email, formData.password);
    setAuth(authData);
    navigate('/dashboard');
  } catch (err) {
    setError('Login failed');
  } finally {
    setLoading(false);
  }
};
```

## Design Consistency
- Keep notinq branding on login/signup pages
- Landing page uses notinq colors (#ff7a00, #001533)
- Maintain glass-morphism effects
- Keep food emoji decorations

## Testing Checklist
- [ ] Landing page loads at `/`
- [ ] "Login" button navigates to `/login`
- [ ] Login form authenticates with backend
- [ ] Signup form creates new users
- [ ] Forgot password flow works
- [ ] After login, redirects to correct dashboard
- [ ] No broken localhost links
- [ ] All images load correctly
- [ ] Responsive on mobile/tablet/desktop

## Benefits
1. **Single Application**: No need to run 3 separate apps
2. **Unified Routing**: React Router handles all navigation
3. **Better UX**: Seamless flow from landing → login → dashboard
4. **Easier Deployment**: One build, one deployment
5. **Consistent Branding**: NotinQ design throughout

## Next Steps
1. Create auth components folder
2. Copy and adapt components
3. Create landing page
4. Update login page
5. Update routing
6. Test complete flow
7. Remove old separate apps

---
**Status**: READY TO IMPLEMENT
**Estimated Time**: 2-3 hours
