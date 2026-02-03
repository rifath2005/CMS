# Institution Feature Flags System - Complete Implementation

## Overview
A comprehensive feature flag and configuration system for institution-level control over all platform features. This enables true multi-tenancy with granular control over ordering, payments, vendors, users, security, and more.

## Architecture

### Database Schema
- **JSONB Columns**: Uses PostgreSQL JSONB for flexible, schema-stable storage
  - `features`: All feature toggles (50+ flags)
  - `limits`: Hard quotas and limits
  - `branding`: UI customization
  - `security`: Security and compliance settings
- **Status Management**: `active`, `suspended`, `inactive`
- **Plan Tiers**: `free`, `custom`, `enterprise`

### Backend Components

#### 1. Types (`src/types/institutionConfig.ts`)
Complete TypeScript interfaces for:
- `InstitutionFeatures`: 50+ feature flags organized by category
- `InstitutionLimits`: Hard limits (users, vendors, orders, etc.)
- `InstitutionBranding`: UI customization
- `InstitutionSecurity`: Security settings
- `InstitutionConfig`: Complete configuration object

#### 2. Middleware (`src/middleware/featureFlag.ts`)
Feature enforcement middleware:
- `requireFeature(featureKey)`: Enforce single feature
- `requireAllFeatures([keys])`: Enforce multiple features (AND logic)
- `requireAnyFeature([keys])`: Enforce at least one feature (OR logic)
- `loadInstitutionFeatures()`: Load features without enforcement

**Usage Example:**
```typescript
// Protect an API route
router.post('/orders', 
  authenticate,
  requireFeature(pool, 'enable_orders', 'Ordering is disabled'),
  createOrder
);

// Multiple features required
router.post('/wallet/topup',
  authenticate,
  requireAllFeatures(pool, ['enable_wallet', 'enable_wallet_topup']),
  topupWallet
);
```

#### 3. Model (`src/models/Institution.ts`)
Enhanced Institution model with methods:
- `getConfig(id)`: Get full configuration
- `updateFeatures(id, features)`: Update feature flags
- `updateLimits(id, limits)`: Update limits
- `updateBranding(id, branding)`: Update branding
- `updateSecurity(id, security)`: Update security
- `updateStatus(id, status)`: Change institution status
- `updatePlan(id, plan)`: Change subscription plan
- `isFeatureEnabled(id, featureKey)`: Check single feature
- `getStats(id)`: Get institution statistics

#### 4. Routes (`src/routes/institutionConfig.ts`)
API endpoints:
- `GET /api/institutions/:id/config` - Get full config
- `PATCH /api/institutions/:id/features` - Update features (Super Admin)
- `PATCH /api/institutions/:id/limits` - Update limits (Super Admin)
- `PATCH /api/institutions/:id/branding` - Update branding (Admin)
- `PATCH /api/institutions/:id/security` - Update security (Super Admin)
- `PATCH /api/institutions/:id/status` - Update status (Super Admin)
- `PATCH /api/institutions/:id/plan` - Update plan (Super Admin)
- `GET /api/institutions/:id/stats` - Get statistics
- `GET /api/institutions/configs` - Get all configs (Super Admin)

### Frontend Components

#### 1. Institution Configuration Page (`client/src/pages/super-admin/InstitutionConfig.tsx`)
Comprehensive UI with 8 tabs:
1. **Ordering & Flow**: Order controls, time windows, pickup options
2. **Payment**: Payment methods, wallet rules, enforcement
3. **Vendors**: Lifecycle, operations, permissions
4. **Users**: Registration, authentication, behavior
5. **Notifications**: Channels, event toggles
6. **Security**: Audit logging, compliance
7. **Limits & Quotas**: Hard limits enforcement
8. **Branding**: Theme, logo, customization

Features:
- Toggle switches for all feature flags
- Number inputs for limits
- Real-time change tracking
- Bulk save functionality
- Status and plan display

#### 2. Enhanced Institutions List (`client/src/pages/super-admin/Institutions.tsx`)
- Settings button links to configuration page
- Status and plan badges
- Quick actions for view, configure, suspend, delete

## Feature Flag Categories

### 1️⃣ ORDERING & FLOW CONTROL (15 flags)
- Core ordering toggles
- Time constraints (windows, holidays, weekends)
- Quantity rules
- Pickup options (QR, OTP, scheduled, instant)
- Status flow automation

### 2️⃣ PAYMENT & FINANCIAL CONTROLS (13 flags)
- Payment methods (wallet, UPI, COD, post-paid)
- Wallet rules (top-up, limits, auto-debit)
- Payment enforcement (before acceptance, after pickup)
- Auto-cancellation

### 3️⃣ VENDOR GOVERNANCE (8 flags)
- Vendor lifecycle (registration, approval, suspension)
- Vendor operations (pricing, products, user data access)
- Vendor limits

### 4️⃣ USER ACCESS & IDENTITY (12 flags)
- Registration controls (self-reg, email verification, domain restriction)
- Authentication (password policy, multi-device, single session)
- User behavior (order limits, cancellation)

### 5️⃣ ORDER FULFILLMENT (6 flags)
- Pickup methods
- Status flow automation
- Acceptance requirements

### 6️⃣ NOTIFICATIONS & REAL-TIME (7 flags)
- Notification channels (real-time, in-app, email, SMS)
- Event-specific toggles
- Socket.IO integration

### 7️⃣ REPORTING & VISIBILITY (4 flags)
- Analytics dashboard
- Revenue visibility
- Sales reports
- Export capabilities

### 8️⃣ SECURITY & COMPLIANCE (5 flags)
- Audit logging
- Payment attempt logging
- Failed login tracking
- Data masking
- Auto-lock on failures

### 9️⃣ BRANDING (4 settings)
- Custom logo
- Theme color
- Institution name display
- Platform branding toggle

### 🔟 LIMITS & QUOTAS (7 hard limits)
- Max users
- Max vendors
- Max orders per day
- Max wallet balance
- Max concurrent sessions
- Max products per vendor
- Max active orders per vendor

## Enforcement Pattern

### API Routes
```typescript
// Every protected route should:
// 1. Authenticate user (JWT)
// 2. Extract institution ID
// 3. Load institution settings
// 4. Check feature flag
// 5. Allow or deny

router.post('/orders', 
  authenticate,
  requireFeature(pool, 'enable_orders'),
  async (req, res) => {
    // Feature is enabled, proceed
    // Access features via req.institutionFeatures
  }
);
```

### Socket.IO Events
```typescript
// Apply same pattern to Socket.IO
socket.on('place_order', async (data) => {
  const institutionId = socket.user.institutionId;
  const features = await getInstitutionFeatures(institutionId);
  
  if (!features.enable_orders) {
    socket.emit('error', { message: 'Ordering is disabled' });
    return;
  }
  
  // Proceed with order
});
```

### Frontend Conditional Rendering
```typescript
// Load features on app init
const features = await api.get('/institutions/my/config');

// Conditionally render UI
{features.enable_wallet && (
  <WalletTopupButton />
)}

// Disable features
<button disabled={!features.allow_order_cancellation_by_user}>
  Cancel Order
</button>
```

## Migration

### Running the Migration
```bash
# Apply the migration
psql -U your_user -d your_database -f src/database/migrations/add-institution-feature-flags.sql
```

### Default Values
All institutions get sensible defaults:
- Ordering: Enabled
- Wallet: Enabled
- QR Code Pickup: Enabled
- Real-time Updates: Enabled
- Audit Logging: Enabled
- Reasonable limits (10,000 users, 50 vendors, etc.)

### Updating Existing Institutions
```sql
-- Update specific institution
UPDATE institutions 
SET features = features || '{"enable_orders": false}'::jsonb
WHERE id = 'institution-id';

-- Update all institutions
UPDATE institutions 
SET limits = limits || '{"max_users": 5000}'::jsonb
WHERE plan = 'free';
```

## Usage Examples

### Example 1: Disable Ordering for Maintenance
```typescript
// Super Admin action
await institutionModel.updateFeatures('inst-123', {
  enable_orders: false
});

// All order endpoints will now return 403
// Frontend will hide order buttons
```

### Example 2: Upgrade Institution Plan
```typescript
// Change plan
await institutionModel.updatePlan('inst-123', 'enterprise');

// Update limits
await institutionModel.updateLimits('inst-123', {
  max_users: 50000,
  max_vendors: 200,
  max_orders_per_day: 10000
});

// Enable premium features
await institutionModel.updateFeatures('inst-123', {
  enable_email_notifications: true,
  enable_sms_notifications: true,
  enable_2fa: true
});
```

### Example 3: Suspend Institution
```typescript
// Suspend for non-payment
await institutionModel.updateStatus('inst-123', 'suspended');

// All API calls will return 403
// Users see "Institution suspended" message
```

### Example 4: Custom Configuration
```typescript
// School wants strict controls
await institutionModel.updateFeatures('school-456', {
  enforce_ordering_time_window: true,
  ordering_start_time: '10:00',
  ordering_end_time: '14:00',
  disable_orders_on_weekends: true,
  enforce_one_active_order: true,
  require_qr_code_for_pickup: true,
  mask_user_data_for_vendors: true
});
```

## Testing

### Backend Tests
```typescript
describe('Feature Flag Middleware', () => {
  it('should block request when feature is disabled', async () => {
    await institutionModel.updateFeatures('inst-1', { enable_orders: false });
    
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderData);
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Feature Disabled');
  });
});
```

### Frontend Tests
```typescript
describe('Order Button', () => {
  it('should be disabled when ordering is disabled', () => {
    const features = { enable_orders: false };
    render(<OrderButton features={features} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Benefits

### For Platform Owners
- **Granular Control**: Toggle any feature for any institution
- **Risk Management**: Disable features during incidents
- **Monetization**: Different features for different plans
- **Compliance**: Enforce security and audit requirements

### For Institution Admins
- **Customization**: Configure platform to match policies
- **Flexibility**: Enable/disable features as needed
- **Branding**: Custom look and feel

### For Developers
- **Clean Code**: Feature checks are centralized
- **Type Safety**: Full TypeScript support
- **Easy Testing**: Mock feature flags easily
- **Documentation**: Self-documenting feature set

## Future Enhancements

1. **Feature Flag History**: Track changes over time
2. **Scheduled Toggles**: Auto-enable/disable at specific times
3. **A/B Testing**: Test features with subset of users
4. **Feature Dependencies**: Auto-enable dependent features
5. **Usage Analytics**: Track which features are used
6. **Cost Tracking**: Associate costs with features
7. **Feature Requests**: Let admins request features
8. **Rollback**: Quick rollback to previous configuration

## Files Created

### Backend
- `src/database/migrations/add-institution-feature-flags.sql` - Database migration
- `src/types/institutionConfig.ts` - TypeScript types
- `src/middleware/featureFlag.ts` - Enforcement middleware
- `src/models/Institution.ts` - Enhanced model (updated)
- `src/routes/institutionConfig.ts` - API routes

### Frontend
- `client/src/pages/super-admin/InstitutionConfig.tsx` - Configuration UI
- `client/src/pages/super-admin/Institutions.tsx` - Enhanced list (updated)

### Documentation
- `INSTITUTION_FEATURE_FLAGS_COMPLETE.md` - This file

## Summary

This implementation provides enterprise-grade feature flag management for multi-tenant SaaS. Every aspect of the platform can be controlled at the institution level, from ordering to security to branding. The system is:

- **Flexible**: JSONB storage allows adding features without schema changes
- **Performant**: GIN indexes for fast JSONB queries
- **Type-Safe**: Full TypeScript support
- **Secure**: Middleware enforcement at API level
- **User-Friendly**: Comprehensive UI for configuration
- **Scalable**: Supports unlimited institutions and features

The feature flag system is production-ready and can be extended as the platform grows.
