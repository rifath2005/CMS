# Unified Application Architecture Plan

## Current State
- **4 separate applications** running on different ports:
  - `client/` - User panel (port 3001)
  - `vendor-panel/` - Vendor panel (port 3002)
  - `admin-panel/` - Institution Admin panel (port 3003)
  - No Super Admin panel exists

## Target State
- **Single unified application** on port 3001
- Single login page that routes based on user role
- Role-based access control (RBAC) for all features

## Architecture

```
Unified App (Port 3001)
├── Login Page (/)
├── Role-based Router
│   ├── MAIN_ADMIN → Super Admin Dashboard
│   │   ├── Platform Statistics
│   │   ├── All Institutions Management
│   │   ├── All Users Management
│   │   ├── System Settings
│   │   └── Audit Logs
│   │
│   ├── INSTITUTION_ADMIN → Institution Admin Dashboard
│   │   ├── Institution Dashboard
│   │   ├── Canteen Management
│   │   ├── Vendor Management
│   │   ├── Institution Users
│   │   └── Institution Analytics
│   │
│   ├── VENDOR → Vendor Dashboard
│   │   ├── Active Orders
│   │   ├── Combined Items
│   │   ├── Products Management
│   │   ├── QR Scanner
│   │   └── Analytics
│   │
│   └── USER → User Dashboard
│       ├── Browse Products
│       ├── Cart
│       ├── Checkout
│       ├── Digital Bill
│       ├── Order History
│       └── Profile
```

## Implementation Steps

### Phase 1: Setup Unified Structure
1. Create new `app/` folder as the unified application
2. Copy and merge all components from separate panels
3. Create role-based routing system
4. Implement unified layout with role-based navigation

### Phase 2: Merge Components
1. Merge all pages from client, vendor-panel, admin-panel
2. Create shared components library
3. Implement role-based component visibility
4. Create unified state management

### Phase 3: Create Super Admin Panel
1. Platform statistics dashboard
2. All institutions management
3. System-wide user management
4. Audit logs viewer
5. System settings

### Phase 4: Testing & Migration
1. Test all role-based routes
2. Verify RBAC permissions
3. Update documentation
4. Deprecate old separate panels

## File Structure

```
app/
├── src/
│   ├── pages/
│   │   ├── Login.tsx (unified)
│   │   ├── super-admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Institutions.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── AuditLogs.tsx
│   │   │   └── Settings.tsx
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Canteens.tsx
│   │   │   ├── Vendors.tsx
│   │   │   └── Analytics.tsx
│   │   ├── vendor/
│   │   │   ├── ActiveOrders.tsx
│   │   │   ├── CombinedItems.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── QRScanner.tsx
│   │   │   └── Analytics.tsx
│   │   └── user/
│   │       ├── Dashboard.tsx
│   │       ├── Products.tsx
│   │       ├── Cart.tsx
│   │       ├── Checkout.tsx
│   │       ├── DigitalBill.tsx
│   │       ├── OrderHistory.tsx
│   │       └── Profile.tsx
│   ├── components/
│   │   ├── shared/ (common components)
│   │   ├── layouts/
│   │   │   ├── SuperAdminLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── VendorLayout.tsx
│   │   │   └── UserLayout.tsx
│   │   └── ProtectedRoute.tsx (role-based)
│   ├── services/ (unified API services)
│   ├── store/ (unified state management)
│   ├── types/ (shared types)
│   └── App.tsx (role-based router)
```

## Benefits

1. **Single Port**: Only one dev server needed
2. **Unified Auth**: Single login, single session
3. **Code Reuse**: Shared components and services
4. **Better UX**: Seamless navigation between roles
5. **Easier Deployment**: One build, one deployment
6. **Maintainability**: Single codebase to maintain

## Migration Strategy

1. Build unified app alongside existing apps
2. Test thoroughly with all roles
3. Switch to unified app
4. Keep old apps for 1 sprint as backup
5. Remove old apps after confirmation
