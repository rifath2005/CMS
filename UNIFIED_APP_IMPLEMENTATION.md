# Unified Application Implementation Guide

## Overview
This guide provides step-by-step instructions to convert the current multi-panel architecture (4 separate apps on different ports) into a single unified application with role-based routing.

## Current Architecture Issues
- ❌ 4 separate applications (client, vendor-panel, admin-panel, no super-admin)
- ❌ Multiple dev servers (ports 3001, 3002, 3003)
- ❌ Duplicate code across panels
- ❌ Complex deployment (4 builds)
- ❌ No super admin panel

## New Architecture Benefits
- ✅ Single application on port 3001
- ✅ Single login with role-based routing
- ✅ Shared components and services
- ✅ Single build and deployment
- ✅ Complete super admin panel

## Implementation Steps

### Step 1: File Structure Setup ✅ DONE

Directories created:
```
client/src/
├── pages/
│   ├── super-admin/  ✅
│   ├── admin/        ✅
│   ├── vendor/       ✅
│   └── user/         ✅
└── components/
    └── layouts/      ✅
```

### Step 2: Move Existing Pages to Role Folders

#### Move User Pages
```bash
# Move existing client pages to user folder
mv client/src/pages/Dashboard.tsx client/src/pages/user/
mv client/src/pages/Products.tsx client/src/pages/user/
mv client/src/pages/Cart.tsx client/src/pages/user/
mv client/src/pages/Checkout.tsx client/src/pages/user/
mv client/src/pages/DigitalBill.tsx client/src/pages/user/
mv client/src/pages/OrderHistory.tsx client/src/pages/user/
mv client/src/pages/Profile.tsx client/src/pages/user/
```

#### Copy Vendor Pages
```bash
# Copy from vendor-panel to client
cp vendor-panel/src/pages/ActiveOrders.tsx client/src/pages/vendor/
cp vendor-panel/src/pages/CombinedItems.tsx client/src/pages/vendor/
cp vendor-panel/src/pages/Products.tsx client/src/pages/vendor/
cp vendor-panel/src/pages/QRScanner.tsx client/src/pages/vendor/
cp vendor-panel/src/pages/Analytics.tsx client/src/pages/vendor/
```

#### Copy Admin Pages
```bash
# Copy from admin-panel to client
cp admin-panel/src/pages/Dashboard.tsx client/src/pages/admin/
cp admin-panel/src/pages/Canteens.tsx client/src/pages/admin/
cp admin-panel/src/pages/Vendors.tsx client/src/pages/admin/
cp admin-panel/src/pages/PlatformStats.tsx client/src/pages/admin/Stats.tsx
```

### Step 3: Create Super Admin Pages

Create these new pages in `client/src/pages/super-admin/`:

1. **Dashboard.tsx** - Platform overview with all institutions
2. **Institutions.tsx** - Manage all institutions
3. **Users.tsx** - Manage all users across institutions
4. **AuditLogs.tsx** - System-wide audit logs
5. **Settings.tsx** - System configuration

### Step 4: Create Role-Based Layouts

Create these layouts in `client/src/components/layouts/`:

1. **SuperAdminLayout.tsx** - Navigation for super admin
2. **AdminLayout.tsx** - Navigation for institution admin
3. **VendorLayout.tsx** - Navigation for vendor
4. **UserLayout.tsx** - Navigation for regular user

### Step 5: Merge Services

Merge all API services from the three panels into `client/src/services/`:
- Auth services (already unified)
- Product services
- Order services
- Analytics services
- Institution services
- Canteen services

### Step 6: Update App.tsx

Replace `client/src/App.tsx` with `client/src/App.unified.tsx`

### Step 7: Update Login Page

Update `client/src/pages/Login.tsx` to be role-agnostic and redirect based on user role after login.

### Step 8: Testing

Test each role:
1. Login as MAIN_ADMIN → Should see super admin dashboard
2. Login as INSTITUTION_ADMIN → Should see admin dashboard
3. Login as VENDOR → Should see vendor dashboard
4. Login as USER → Should see user dashboard

### Step 9: Update Package.json

Update the dev script to only run the unified app:
```json
{
  "scripts": {
    "dev": "vite --port 3001"
  }
}
```

### Step 10: Deprecate Old Panels

After testing, the old panels can be archived:
- `vendor-panel/` → Archive
- `admin-panel/` → Archive

## Quick Start Commands

```bash
# 1. Navigate to client folder
cd client

# 2. Install dependencies (if needed)
npm install

# 3. Start unified app
npm run dev

# 4. Backend should be running
# In another terminal:
cd ..
npm run dev
```

## Login Credentials for Testing

### Super Admin (MAIN_ADMIN)
- Email: `superadmin@cms.com` (needs to be created)
- Password: `password123`

### Institution Admin
- Email: `admin@mitcoe.edu`
- Password: `password123`

### Vendor
- Email: `vendor.maincanteen@mitcoe.edu`
- Password: `password123`

### User
- Email: `john.doe@mitcoe.edu`
- Password: `password123`

## Files Created

1. ✅ `client/src/App.unified.tsx` - New unified router
2. ✅ `client/src/components/ProtectedRoute.tsx` - Updated with role-based access
3. ✅ `UNIFIED_APP_PLAN.md` - Architecture plan
4. ✅ `UNIFIED_APP_IMPLEMENTATION.md` - This file

## Next Steps

1. **Create Super Admin Pages** (5 pages)
2. **Create Role-Based Layouts** (4 layouts)
3. **Move/Copy Existing Pages** to role folders
4. **Merge Services** from all panels
5. **Update Login** to be role-agnostic
6. **Test All Roles**
7. **Deploy Unified App**

## Migration Timeline

- **Day 1-2**: Create super admin pages and layouts
- **Day 3**: Move and organize existing pages
- **Day 4**: Merge services and fix imports
- **Day 5**: Testing and bug fixes
- **Day 6**: Documentation and deployment

## Rollback Plan

If issues arise:
1. Keep old panels running temporarily
2. Fix issues in unified app
3. Switch back to unified app
4. Old panels can be removed after 1 week of stable operation

## Support

For questions or issues during implementation:
1. Check this guide
2. Review `UNIFIED_APP_PLAN.md`
3. Test with all 4 user roles
4. Verify RBAC permissions
