# Team Task Distribution - Canteen Management System

## Strategy: Minimize Merge Conflicts
Tasks are split by **module/folder** to ensure team members work on different files. Each member has a clear domain with minimal overlap.

---

## 👤 MEMBER 1: Backend Core Services (Authentication, Institution, Products)

**Focus Areas**: `src/services/`, `src/models/`, `src/routes/`  
**Estimated Time**: 2-3 days  
**Files to Work On**: Separate service modules

**🎉 STATUS: 85% COMPLETE (17/20 tasks done)**

### Tasks:

#### ✅ Already Completed (Reference Only):
- Task 1: Infrastructure setup
- Task 2.1: User model and auth interfaces
- Task 2.3: User registration with email validation

#### 🔨 To Complete:

**Task 2: Complete Authentication Service**
- [x] 2.5: Implement login and session management
  - Files: `src/services/auth/session.ts`, `src/routes/auth.routes.ts` (add login)
- [x] 2.7: Implement authorization middleware
  - Files: `src/middleware/auth.middleware.ts`, `src/middleware/rbac.middleware.ts`
- [x] 2.10: Implement rate limiting and audit logging
  - Files: `src/middleware/rateLimiter.ts`, `src/services/audit/AuditService.ts`

**Task 3: Checkpoint - Ensure authentication tests pass**
- [ ] 3: Run all authentication tests

**Task 4: Implement Institution Management Service**
- [x] 4.1: Create Institution and Canteen models (✅ Institution done, add Canteen)
  - Files: `src/models/Canteen.ts`
- [x] 4.2: Implement institution creation by Main Admin
  - Files: `src/services/institution/InstitutionService.ts`, `src/routes/institution.routes.ts`
- [x] 4.4: Implement Institution Admin credential assignment
  - Files: `src/services/institution/InstitutionService.ts`
- [x] 4.6: Implement canteen registration
  - Files: `src/services/canteen/CanteenService.ts`, `src/routes/canteen.routes.ts`
- [x] 4.8: Implement vendor approval workflow
  - Files: `src/services/canteen/CanteenService.ts`
- [x] 4.10: Implement vendor deactivation
  - Files: `src/services/canteen/CanteenService.ts`
- [x] 4.12: Implement platform-level analytics
  - Files: `src/services/analytics/PlatformAnalytics.ts`

**Task 5: Checkpoint - Ensure institution management tests pass**
- [ ] 5: Run institution tests

**Task 6: Implement Product and Inventory Service**
- [x] 6.1: Create Product model and interfaces
  - Files: `src/models/Product.ts`
- [x] 6.2: Implement product creation
  - Files: `src/services/product/ProductService.ts`, `src/routes/product.routes.ts`
- [x] 6.4: Implement product updates
  - Files: `src/services/product/ProductService.ts`
- [x] 6.6: Implement stock management
  - Files: `src/services/product/ProductService.ts`, `src/services/product/StockService.ts`
- [x] 6.8: Implement product browsing with institutional isolation
  - Files: `src/services/product/ProductServsice.ts`
- [x] 6.10: Implement cart validation
  - Files: `src/services/cart/CartService.ts`

**Task 7: Checkpoint - Ensure product management tests pass**
- [ ] 7: Run product tests

---

## 👤 MEMBER 2: Backend Order & Payment Flow (Orders, Payments, Digital Bills, QR Codes)

**Focus Areas**: `src/services/order/`, `src/services/payment/`, `src/services/bill/`  
**Estimated Time**: 2-3 days  
**Files to Work On**: Order-related modules

### Tasks:

**Task 8: Implement Payment Service**
- [ ] 8.1: Create Payment model and interfaces
  - Files: `src/models/Payment.ts`
- [ ] 8.2: Integrate UPI payment gateway
  - Files: `src/services/payment/PaymentService.ts`, `src/services/payment/UpiGateway.ts`
- [ ] 8.3: Implement payment status tracking
  - Files: `src/services/payment/PaymentService.ts`, `src/routes/payment.routes.ts`

**Task 9: Implement Order Service**
- [ ] 9.1: Create Order and OrderItem models
  - Files: `src/models/Order.ts`, `src/models/OrderItem.ts`
- [ ] 9.2: Implement shopping cart functionality
  - Files: `src/services/cart/CartService.ts`, `src/routes/cart.routes.ts`
- [ ] 9.4: Implement order total calculation
  - Files: `src/services/order/OrderCalculation.ts`
- [ ] 9.6: Implement order creation with payment verification
  - Files: `src/services/order/OrderService.ts`, `src/routes/order.routes.ts`

**Task 10: Checkpoint - Ensure order creation tests pass**
- [ ] 10: Run order tests

**Task 11: Implement Digital Bill Service with QR Code**
- [ ] 11.1: Create DigitalBill model and QR code generation
  - Files: `src/models/DigitalBill.ts`, `src/services/bill/QRCodeService.ts`
- [ ] 11.2: Implement bill generation after payment
  - Files: `src/services/bill/BillService.ts`
- [ ] 11.4: Implement bill timer and expiration logic
  - Files: `src/services/bill/BillTimerService.ts`, `src/jobs/billExpiration.job.ts`
- [ ] 11.6: Implement bill expiration notification
  - Files: `src/services/notification/NotificationService.ts`
- [ ] 11.8: Implement QR code scanning and verification
  - Files: `src/services/bill/QRVerificationService.ts`, `src/routes/bill.routes.ts`
- [ ] 11.10: Implement delivery confirmation
  - Files: `src/services/order/DeliveryService.ts`

**Task 12: Checkpoint - Ensure bill and QR code tests pass**
- [ ] 12: Run bill tests

**Task 13: Implement Vendor Order Management**
- [ ] 13.1: Implement active order list for vendors
  - Files: `src/services/vendor/VendorOrderService.ts`, `src/routes/vendor.routes.ts`
- [ ] 13.3: Implement combined item list aggregation
  - Files: `src/services/vendor/CombinedItemService.ts`
- [ ] 13.5: Implement order detail view
  - Files: `src/services/vendor/VendorOrderService.ts`
- [ ] 13.7: Implement order removal from active list on delivery
  - Files: `src/services/vendor/VendorOrderService.ts`

**Task 14: Implement Order History**
- [ ] 14.1: Create order history endpoint
  - Files: `src/services/order/OrderHistoryService.ts`, `src/routes/orderHistory.routes.ts`
- [ ] 14.3: Implement order history filtering
  - Files: `src/services/order/OrderHistoryService.ts`
- [ ] 14.5: Implement order history addition on delivery
  - Files: `src/services/order/OrderHistoryService.ts`

**Task 15: Implement Analytics Service**
- [ ] 15.1: Create sales report generation
  - Files: `src/services/analytics/SalesAnalytics.ts`
- [ ] 15.3: Implement top products ranking
  - Files: `src/services/analytics/ProductAnalytics.ts`
- [ ] 15.5: Implement order volume trends
  - Files: `src/services/analytics/TrendAnalytics.ts`
- [ ] 15.7: Implement CSV export
  - Files: `src/services/analytics/ExportService.ts`

**Task 16: Implement User Profile and Dashboard**
- [ ] 16.1: Create profile retrieval endpoint
  - Files: `src/services/user/ProfileService.ts`, `src/routes/profile.routes.ts`
- [ ] 16.3: Implement active orders display
  - Files: `src/services/user/UserDashboardService.ts`
- [ ] 16.5: Implement user statistics
  - Files: `src/services/user/UserStatsService.ts`
- [ ] 16.7: Implement profile update
  - Files: `src/services/user/ProfileService.ts`

**Task 17: Checkpoint - Ensure all backend tests pass**
- [ ] 17: Run all backend tests

---

## 👤 MEMBER 3: Real-Time & Frontend (WebSocket, React UI)

**Focus Areas**: `src/websocket/`, `client/` (frontend folder)  
**Estimated Time**: 2-3 days  
**Files to Work On**: WebSocket and all frontend code

### Tasks:

**Task 18: Implement WebSocket Manager for Real-Time Updates**
- [ ] 18.1: Set up WebSocket server
  - Files: `src/websocket/WebSocketServer.ts`, `src/websocket/ConnectionManager.ts`
- [ ] 18.2: Implement order status broadcast
  - Files: `src/websocket/OrderBroadcast.ts`
- [ ] 18.4: Implement stock change notifications
  - Files: `src/websocket/StockBroadcast.ts`
- [ ] 18.6: Implement new order notifications
  - Files: `src/websocket/VendorNotifications.ts`
- [ ] 18.8: Implement bill timer updates
  - Files: `src/websocket/BillTimerBroadcast.ts`

**Task 19: Implement Frontend - User Interface**
- [ ] 19.1: Set up React project with TypeScript
  - Files: `client/package.json`, `client/tsconfig.json`, `client/src/App.tsx`
- [ ] 19.2: Implement authentication pages
  - Files: `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`
- [ ] 19.3: Implement product browsing page
  - Files: `client/src/pages/Products.tsx`, `client/src/components/ProductCard.tsx`
- [ ] 19.4: Implement shopping cart page
  - Files: `client/src/pages/Cart.tsx`, `client/src/components/CartItem.tsx`
- [ ] 19.5: Implement payment integration
  - Files: `client/src/pages/Checkout.tsx`, `client/src/services/paymentService.ts`
- [ ] 19.6: Implement digital bill display
  - Files: `client/src/pages/DigitalBill.tsx`, `client/src/components/QRCode.tsx`, `client/src/components/Timer.tsx`
- [ ] 19.7: Implement order history page
  - Files: `client/src/pages/OrderHistory.tsx`
- [ ] 19.8: Implement user dashboard
  - Files: `client/src/pages/Dashboard.tsx`
- [ ] 19.9: Implement profile management
  - Files: `client/src/pages/Profile.tsx`

**Task 20: Implement Frontend - Vendor Panel**
- [ ] 20.1: Set up vendor panel React app
  - Files: `vendor-panel/package.json`, `vendor-panel/src/App.tsx`
- [ ] 20.2: Implement vendor authentication
  - Files: `vendor-panel/src/pages/VendorLogin.tsx`
- [ ] 20.3: Implement product management interface
  - Files: `vendor-panel/src/pages/Products.tsx`, `vendor-panel/src/components/ProductForm.tsx`
- [ ] 20.4: Implement active orders view
  - Files: `vendor-panel/src/pages/ActiveOrders.tsx`
- [ ] 20.5: Implement combined item list view
  - Files: `vendor-panel/src/pages/CombinedItems.tsx`
- [ ] 20.6: Implement QR code scanner
  - Files: `vendor-panel/src/pages/QRScanner.tsx`, `vendor-panel/src/components/Scanner.tsx`
- [ ] 20.7: Implement analytics dashboard
  - Files: `vendor-panel/src/pages/Analytics.tsx`

**Task 21: Implement Frontend - Admin Panels**
- [ ] 21.1: Implement Main Admin panel
  - Files: `admin-panel/src/pages/MainAdmin.tsx`, `admin-panel/src/pages/Institutions.tsx`
- [ ] 21.2: Implement Institution Admin panel
  - Files: `admin-panel/src/pages/InstitutionAdmin.tsx`, `admin-panel/src/pages/Canteens.tsx`

**Task 22: Final Integration and Testing**
- [ ] 22.1: Integration testing
  - Files: `tests/integration/`
- [ ] 22.2: End-to-end testing
  - Files: `tests/e2e/`
- [ ] 22.3: Performance testing
  - Files: `tests/performance/`

**Task 23: Final Checkpoint - Complete system verification**
- [ ] 23: Final verification

---

## 📋 Coordination Guidelines

### Branch Strategy:
```bash
# Member 1
git checkout -b feature/backend-core-services

# Member 2
git checkout -b feature/backend-order-payment

# Member 3
git checkout -b feature/websocket-frontend
```

### Merge Order (to minimize conflicts):
1. **Member 1** merges first (core services, models, routes)
2. **Member 2** merges second (depends on Member 1's models)
3. **Member 3** merges last (depends on backend APIs)

### Shared Files (Coordinate Changes):
- `src/types/index.ts` - All members may need to add types
- `src/index.ts` - All members may need to mount routes
- `package.json` - Coordinate dependency additions

### Communication:
- **Daily sync**: Share progress and blockers
- **Shared types**: Member 1 should define types first
- **API contracts**: Document endpoints as you create them
- **Test data**: Share test institution/user credentials

### Testing:
- Each member writes tests for their modules
- Run `npm test` before pushing
- Integration tests run after all merges

---

## 📊 Progress Tracking

### Member 1 Progress: 17 / 20 tasks ✅ (85% Complete)
**Completed:**
- ✅ Task 2.5: Login and session management
- ✅ Task 2.7: Authorization middleware
- ✅ Task 2.10: Rate limiting and audit logging
- ✅ Task 4.1: Institution and Canteen models
- ✅ Task 4.2: Institution creation
- ✅ Task 4.4: Institution Admin credential assignment
- ✅ Task 4.6: Canteen registration
- ✅ Task 4.8: Vendor approval workflow
- ✅ Task 4.10: Vendor deactivation
- ✅ Task 4.12: Platform-level analytics
- ✅ Task 6.1: Product model
- ✅ Task 6.2: Product creation
- ✅ Task 6.4: Product updates
- ✅ Task 6.6: Stock management
- ✅ Task 6.8: Product browsing with institutional isolation
- ✅ Task 6.10: Cart validation

**Remaining:**
- ⏳ Task 3: Run authentication tests
- ⏳ Task 5: Run institution tests
- ⏳ Task 7: Run product tests

### Member 2 Progress: 0 / 25 tasks  
### Member 3 Progress: 0 / 18 tasks

**Total Progress: 17 / 63 tasks (27%)**

---

## 🚀 Quick Start for Each Member

### Member 1:
```bash
git pull origin main
git checkout -b feature/backend-core-services
# Start with Task 2.5 (login and session management)
```

### Member 2:
```bash
git pull origin main
git checkout -b feature/backend-order-payment
# Start with Task 8.1 (Payment model)
```

### Member 3:
```bash
git pull origin main
git checkout -b feature/websocket-frontend
# Start with Task 18.1 (WebSocket server setup)
```

---

## ⚠️ Important Notes

1. **Skip optional property-based test tasks** (marked with `*`) for faster completion
2. **Focus on required functionality** first
3. **Write minimal tests** - just enough to verify functionality
4. **Coordinate on shared files** - use team chat before editing
5. **Commit frequently** - small commits are easier to merge
6. **Pull before push** - always sync with main branch

---

## 📞 Need Help?

- **Merge conflicts**: Ask team lead or use `git mergetool`
- **API questions**: Check `SD/design.md` for interfaces
- **Requirements**: Check `SD/requirements.md`
- **Database schema**: Check `src/database/schema.sql`

Good luck team! 🎉
