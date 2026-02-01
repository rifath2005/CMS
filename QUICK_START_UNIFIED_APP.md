# Quick Start: Unified Application

## What Was Done

I've set up the foundation for a **unified single-application architecture** with role-based access control (RBAC). Instead of 4 separate apps on different ports, you'll have ONE app that routes users to different dashboards based on their role.

## Files Created

### 1. Core Router
- ✅ `client/src/App.unified.tsx` - Main router with role-based routing

### 2. Updated Components
- ✅ `client/src/components/ProtectedRoute.tsx` - Now supports role-based access

### 3. Example Super Admin Files
- ✅ `client/src/pages/super-admin/Dashboard.tsx` - Super admin dashboard
- ✅ `client/src/components/layouts/SuperAdminLayout.tsx` - Super admin layout with navigation

### 4. Documentation
- ✅ `UNIFIED_APP_PLAN.md` - Architecture overview
- ✅ `UNIFIED_APP_IMPLEMENTATION.md` - Detailed implementation steps
- ✅ `QUICK_START_UNIFIED_APP.md` - This file

## How It Works

```
Single Login Page (/)
        ↓
   Check User Role
        ↓
    ┌───┴───┬───────┬────────┐
    ↓       ↓       ↓        ↓
MAIN_ADMIN INST_ADMIN VENDOR USER
    ↓       ↓       ↓        ↓
Super Admin Institution Vendor User
Dashboard   Dashboard  Dashboard Dashboard
```

## What You Need to Do Next

### Option 1: Quick Test (Recommended First)

1. **Backup current App.tsx**:
   ```bash
   cd client/src
   cp App.tsx App.old.tsx
   ```

2. **Replace with unified version**:
   ```bash
   cp App.unified.tsx App.tsx
   ```

3. **Create placeholder pages** (temporary):
   Create empty placeholder files for pages that don't exist yet:
   ```bash
   # Super Admin pages (5 files)
   touch client/src/pages/super-admin/Institutions.tsx
   touch client/src/pages/super-admin/Users.tsx
   touch client/src/pages/super-admin/AuditLogs.tsx
   touch client/src/pages/super-admin/Settings.tsx
   
   # Admin pages (copy from admin-panel or create placeholders)
   # Vendor pages (copy from vendor-panel or create placeholders)
   # User pages (move existing pages to user/ folder)
   ```

4. **Start the app**:
   ```bash
   cd client
   npm run dev
   ```

5. **Test with different roles**:
   - Login as user: `john.doe@mitcoe.edu` / `password123`
   - Login as vendor: `vendor.maincanteen@mitcoe.edu` / `password123`
   - Login as admin: `admin@mitcoe.edu` / `password123`

### Option 2: Complete Implementation

Follow the detailed steps in `UNIFIED_APP_IMPLEMENTATION.md`

## Architecture Benefits

### Before (Current)
```
❌ 4 separate apps
❌ 4 dev servers (ports 3001, 3002, 3003, ???)
❌ 4 separate builds
❌ Duplicate code
❌ Complex CORS setup
❌ No super admin panel
```

### After (Unified)
```
✅ 1 unified app
✅ 1 dev server (port 3001)
✅ 1 build
✅ Shared components
✅ Simple CORS
✅ Complete super admin panel
```

## Role-Based Routes

### Super Admin (MAIN_ADMIN)
- `/super-admin/dashboard` - Platform overview
- `/super-admin/institutions` - Manage all institutions
- `/super-admin/users` - Manage all users
- `/super-admin/audit-logs` - System audit logs
- `/super-admin/settings` - System settings

### Institution Admin (INSTITUTION_ADMIN)
- `/admin/dashboard` - Institution dashboard
- `/admin/canteens` - Manage canteens
- `/admin/vendors` - Manage vendors
- `/admin/stats` - Institution statistics

### Vendor (VENDOR)
- `/vendor/dashboard` - Vendor overview
- `/vendor/orders` - Active orders
- `/vendor/combined-items` - Combined item list
- `/vendor/products` - Product management
- `/vendor/qr-scanner` - QR code scanner
- `/vendor/analytics` - Sales analytics

### User (USER)
- `/dashboard` - User dashboard
- `/products` - Browse products
- `/cart` - Shopping cart
- `/checkout` - Checkout
- `/bill/:orderId` - Digital bill
- `/orders` - Order history
- `/profile` - User profile

## Creating Missing Pages

### Template for Empty Pages

```typescript
const PlaceholderPage = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Page Title</h1>
            <p className="text-gray-600">This page is under construction.</p>
        </div>
    )
}

export default PlaceholderPage
```

### Pages to Create

1. **Super Admin** (5 pages):
   - ✅ Dashboard.tsx (created)
   - ⏳ Institutions.tsx
   - ⏳ Users.tsx
   - ⏳ AuditLogs.tsx
   - ⏳ Settings.tsx

2. **Layouts** (4 layouts):
   - ✅ SuperAdminLayout.tsx (created)
   - ⏳ AdminLayout.tsx
   - ⏳ VendorLayout.tsx
   - ⏳ UserLayout.tsx

3. **Copy from existing panels**:
   - Admin pages from `admin-panel/src/pages/`
   - Vendor pages from `vendor-panel/src/pages/`
   - Move user pages to `client/src/pages/user/`

## Testing Checklist

- [ ] Login as USER → See user dashboard
- [ ] Login as VENDOR → See vendor dashboard
- [ ] Login as INSTITUTION_ADMIN → See admin dashboard
- [ ] Login as MAIN_ADMIN → See super admin dashboard
- [ ] Try accessing unauthorized routes → Should redirect
- [ ] Logout works from all dashboards
- [ ] Navigation works within each role
- [ ] Shared components work across roles

## Troubleshooting

### Issue: "Module not found" errors
**Solution**: Create placeholder pages for missing components

### Issue: "Cannot read property 'role' of undefined"
**Solution**: Make sure user is logged in and auth store has user data

### Issue: Redirects not working
**Solution**: Check ProtectedRoute.tsx has correct role checks

### Issue: Layout not showing
**Solution**: Verify layout component exists and is imported correctly

## Next Steps After Testing

1. ✅ Verify unified app works with all roles
2. Create remaining super admin pages
3. Create remaining layouts
4. Copy/move all pages from separate panels
5. Merge all services
6. Update documentation
7. Deploy unified app
8. Archive old panels

## Rollback Plan

If something breaks:
```bash
cd client/src
cp App.old.tsx App.tsx
npm run dev
```

## Support

- Check `UNIFIED_APP_IMPLEMENTATION.md` for detailed steps
- Check `UNIFIED_APP_PLAN.md` for architecture overview
- Test with all 4 user roles
- Verify RBAC permissions work correctly

## Super Admin User Creation

You'll need to create a super admin user in the database:

```sql
-- Create super admin user
INSERT INTO users (id, email, password_hash, name, role, institution_id, created_at)
VALUES (
    gen_random_uuid(),
    'superadmin@cms.com',
    '$2b$10$...',  -- Hash for 'password123'
    'Super Administrator',
    'MAIN_ADMIN',
    NULL,  -- Super admin doesn't belong to any institution
    NOW()
);
```

Or use the existing script:
```bash
node scripts/create-test-users.ts
```

## Summary

You now have:
1. ✅ Unified app router ready
2. ✅ Role-based routing configured
3. ✅ Super admin dashboard example
4. ✅ Super admin layout example
5. ✅ Protected routes with RBAC
6. ✅ Complete documentation

**Next**: Create the remaining pages and layouts, then test with all roles!
