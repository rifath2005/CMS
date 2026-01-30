# Design Document: Canteen Management System

## Overview

The Canteen Management System is a multi-tenant, role-based platform designed for campus environments. The architecture emphasizes real-time synchronization, payment authenticity, and a unique delivery verification workflow where vendors confirm order delivery directly on the user's device.

The system follows a hierarchical structure: Main Admin → Institution → Vendor → User, with strict access controls at each level. The core innovation is the time-bound digital bill with a 15-minute validity window and QR code-based delivery verification, ensuring orders are collected promptly and preventing fraudulent delivery claims.

Key architectural principles:
- **Prepaid-only workflow**: No order creation without confirmed payment
- **QR code delivery verification**: Vendor scans user's QR code to confirm delivery
- **Real-time synchronization**: WebSocket-based updates across all user interfaces
- **Institutional isolation**: Users can only access canteens within their institution
- **Scalable multi-tenancy**: Support for multiple institutions on a single platform

## Architecture

### System Architecture

The system follows a three-tier architecture with real-time communication capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Client  │  │ Mobile Client│  │ Vendor Panel │      │
│  │  (React/Vue) │  │  (Optional)  │  │   (React)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │   API Gateway  │
                    │  (Rate Limit)  │
                    └───────┬───────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ Order Service│  │ Payment Svc  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Service │  │Vendor Service│  │ Notification │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ WebSocket    │  │ Analytics    │                         │
│  │ Manager      │  │ Service      │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │  S3/Storage  │      │
│  │  (Primary)   │  │   (Cache)    │  │   (Images)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Recommendations

**Backend:**
- Node.js with Express or NestJS (TypeScript)
- PostgreSQL for relational data
- Redis for caching and session management
- WebSocket (Socket.io) for real-time updates

**Frontend:**
- React or Vue.js with TypeScript
- State management: Redux/Zustand or Vuex/Pinia
- WebSocket client for real-time updates
- Progressive Web App (PWA) capabilities

**Infrastructure:**
- Docker containers for microservices
- Load balancer (Nginx/AWS ALB)
- CDN for static assets and images
- Message queue (RabbitMQ/AWS SQS) for async processing

## Components and Interfaces

### 1. Authentication Service

**Responsibilities:**
- User registration with institutional email validation
- Login and session management
- Role-based access control (RBAC)
- JWT token generation and validation

**Key Interfaces:**

```typescript
interface AuthService {
  register(email: string, password: string, name: string): Promise<User>
  login(email: string, password: string): Promise<AuthToken>
  validateInstitutionalEmail(email: string): Promise<boolean>
  verifyToken(token: string): Promise<User>
  assignRole(userId: string, role: UserRole): Promise<void>
}

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  institutionId: string
  createdAt: Date
}

enum UserRole {
  MAIN_ADMIN = 'MAIN_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  VENDOR = 'VENDOR',
  USER = 'USER'
}
```

### 2. Institution Management Service

**Responsibilities:**
- Create and manage institutions
- Register canteens and assign vendor IDs
- Manage institutional email domains
- Platform-level analytics

**Key Interfaces:**

```typescript
interface InstitutionService {
  createInstitution(data: InstitutionData): Promise<Institution>
  registerCanteen(institutionId: string, data: CanteenData): Promise<Canteen>
  assignVendorId(canteenId: string): Promise<string>
  approveVendor(vendorId: string): Promise<void>
  getInstitutionStats(institutionId: string): Promise<InstitutionStats>
}

interface Institution {
  id: string
  name: string
  emailDomain: string
  contactInfo: ContactInfo
  createdAt: Date
}

interface Canteen {
  id: string
  institutionId: string
  vendorId: string  // e.g., "SS1", "SS2"
  name: string
  location: string
  operatingHours: OperatingHours
  isActive: boolean
}
```

### 3. Product and Inventory Service

**Responsibilities:**
- Product CRUD operations
- Stock management
- Product availability checks
- Low stock alerts

**Key Interfaces:**

```typescript
interface ProductService {
  createProduct(vendorId: string, data: ProductData): Promise<Product>
  updateProduct(productId: string, data: Partial<ProductData>): Promise<Product>
  updateStock(productId: string, quantity: number): Promise<void>
  checkAvailability(productId: string): Promise<boolean>
  getProductsByVendor(vendorId: string): Promise<Product[]>
  notifyLowStock(productId: string): Promise<void>
}

interface Product {
  id: string
  vendorId: string
  name: string
  description: string
  price: number
  category: string
  stockQuantity: number
  imageUrl: string
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 4. Order Service

**Responsibilities:**
- Order creation after payment confirmation
- Order status management
- Combined item list generation for vendors
- Order history tracking

**Key Interfaces:**

```typescript
interface OrderService {
  createOrder(userId: string, cartItems: CartItem[], paymentId: string): Promise<Order>
  getOrderById(orderId: string): Promise<Order>
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>
  getActiveOrdersByVendor(vendorId: string): Promise<Order[]>
  getCombinedItemList(vendorId: string): Promise<CombinedItem[]>
  getUserOrderHistory(userId: string): Promise<Order[]>
  verifyDelivery(orderId: string, billValid: boolean): Promise<void>
}

interface Order {
  id: string
  userId: string
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  paymentId: string
  status: OrderStatus
  billGeneratedAt: Date
  billExpiresAt: Date
  deliveredAt?: Date
  createdAt: Date
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  imageUrl: string
}

enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED'
}

interface CombinedItem {
  productId: string
  productName: string
  totalQuantity: number
  imageUrl: string
}
```

### 5. Payment Service

**Responsibilities:**
- UPI payment gateway integration
- Payment verification
- Payment status tracking
- Refund processing (if needed)

**Key Interfaces:**

```typescript
interface PaymentService {
  initiatePayment(userId: string, amount: number, orderId: string): Promise<PaymentIntent>
  verifyPayment(paymentId: string): Promise<PaymentStatus>
  getPaymentDetails(paymentId: string): Promise<Payment>
  processRefund(paymentId: string, amount: number): Promise<Refund>
}

interface Payment {
  id: string
  userId: string
  amount: number
  status: PaymentStatus
  upiTransactionId: string
  createdAt: Date
  completedAt?: Date
}

enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}
```

### 6. Digital Bill Service

**Responsibilities:**
- Generate time-bound digital bills
- Generate unique QR codes for each bill
- Manage 15-minute countdown timer
- Validate bill expiration
- Handle QR code scanning and delivery verification
- Prevent duplicate QR code scans

**Key Interfaces:**

```typescript
interface BillService {
  generateBill(orderId: string): Promise<DigitalBill>
  generateQRCode(billId: string): Promise<string>
  getBillByOrderId(orderId: string): Promise<DigitalBill>
  checkBillValidity(billId: string): Promise<boolean>
  getRemainingTime(billId: string): Promise<number>
  markBillAsExpired(billId: string): Promise<void>
  verifyQRCode(qrData: string): Promise<QRVerificationResult>
  confirmDelivery(billId: string, validationToken: string): Promise<void>
}

interface DigitalBill {
  id: string
  orderId: string
  userId: string
  userName: string
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  paymentTimestamp: Date
  generatedAt: Date
  expiresAt: Date
  remainingSeconds: number
  isValid: boolean
  isDelivered: boolean
  qrCode: string
  validationToken: string
}

interface QRVerificationResult {
  isValid: boolean
  billId?: string
  orderId?: string
  errorMessage?: string
}
```

### 7. WebSocket Manager

**Responsibilities:**
- Maintain real-time connections
- Broadcast order updates
- Send timer updates
- Notify vendors of new orders

**Key Interfaces:**

```typescript
interface WebSocketManager {
  connect(userId: string, role: UserRole): Promise<void>
  disconnect(userId: string): Promise<void>
  broadcastOrderUpdate(orderId: string, update: OrderUpdate): Promise<void>
  sendTimerUpdate(userId: string, remainingSeconds: number): Promise<void>
  notifyVendor(vendorId: string, notification: Notification): Promise<void>
  sendStockAlert(vendorId: string, productId: string): Promise<void>
}

interface OrderUpdate {
  orderId: string
  status: OrderStatus
  timestamp: Date
}
```

### 8. Analytics Service

**Responsibilities:**
- Generate sales reports
- Calculate revenue metrics
- Track order volumes
- Identify top-selling products

**Key Interfaces:**

```typescript
interface AnalyticsService {
  getSalesReport(vendorId: string, period: TimePeriod): Promise<SalesReport>
  getRevenueMetrics(vendorId: string, startDate: Date, endDate: Date): Promise<RevenueMetrics>
  getTopProducts(vendorId: string, limit: number): Promise<ProductSales[]>
  getOrderVolumeTrends(vendorId: string, period: TimePeriod): Promise<VolumeTrend[]>
  exportSalesData(vendorId: string, format: ExportFormat): Promise<string>
}

interface SalesReport {
  vendorId: string
  period: TimePeriod
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: ProductSales[]
}

enum TimePeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}
```

## Data Models

### Database Schema

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  institution_id UUID REFERENCES institutions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_institution ON users(institution_id);
```

**Institutions Table:**
```sql
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email_domain VARCHAR(255) UNIQUE NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Canteens Table:**
```sql
CREATE TABLE canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) NOT NULL,
  vendor_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  operating_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_canteens_institution ON canteens(institution_id);
CREATE INDEX idx_canteens_vendor ON canteens(vendor_id);
```

**Products Table:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR(50) REFERENCES canteens(vendor_id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_available ON products(is_available);
```

**Orders Table:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  vendor_id VARCHAR(50) REFERENCES canteens(vendor_id) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  bill_generated_at TIMESTAMP NOT NULL,
  bill_expires_at TIMESTAMP NOT NULL,
  qr_code TEXT NOT NULL,
  validation_token VARCHAR(255) UNIQUE NOT NULL,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_expires ON orders(bill_expires_at);
CREATE INDEX idx_orders_validation_token ON orders(validation_token);
```

**Order Items Table:**
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

**Payments Table:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  upi_transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### Redis Cache Structure

**Session Storage:**
```
Key: session:{userId}
Value: { token, role, institutionId, expiresAt }
TTL: 24 hours
```

**Active Orders Cache:**
```
Key: active_orders:{vendorId}
Value: [orderId1, orderId2, ...]
TTL: 1 hour (refreshed on access)
```

**Combined Item List Cache:**
```
Key: combined_items:{vendorId}
Value: { productId: totalQuantity, ... }
TTL: 5 minutes (refreshed on order changes)
```

**Bill Timer Cache:**
```
Key: bill_timer:{orderId}
Value: { expiresAt, isValid }
TTL: 15 minutes
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Authentication and Authorization Properties

**Property 1: Institutional Email Validation**
*For any* email address, registration should succeed if and only if the email domain matches a registered institution's domain.
**Validates: Requirements 1.1, 1.2**

**Property 2: Role Assignment Correctness**
*For any* user with valid credentials, the authentication system should return the role that matches the user's stored role in the database.
**Validates: Requirements 1.3**

**Property 3: Authorization Enforcement**
*For any* user-feature pair, access should be granted if and only if the user's role has permission for that feature.
**Validates: Requirements 1.4, 1.5**

### Institution Management Properties

**Property 4: Institution Creation Completeness**
*For any* valid institution data (name, domain, contact info), the system should successfully create an institution with all provided fields stored correctly.
**Validates: Requirements 2.1**

**Property 5: Institution ID Uniqueness**
*For any* set of created institutions, all institution identifiers should be distinct.
**Validates: Requirements 2.2**

**Property 6: Admin Credential Assignment**
*For any* institution, the system should allow creation of Institution_Admin credentials that are correctly associated with that institution.
**Validates: Requirements 2.3**

**Property 7: Platform Statistics Aggregation**
*For any* set of institutions, platform-level statistics should correctly aggregate data from all institutions.
**Validates: Requirements 2.4**

**Property 8: Email Domain Configuration**
*For any* newly created institution with domain D, email addresses with domain D should subsequently pass validation.
**Validates: Requirements 2.5**

### Canteen and Vendor Management Properties

**Property 9: Canteen Registration Completeness**
*For any* valid canteen data (name, location, operating hours), the system should successfully register the canteen with all provided fields stored correctly.
**Validates: Requirements 3.1**

**Property 10: Vendor ID Uniqueness**
*For any* set of registered canteens, all assigned vendor identifiers should be distinct.
**Validates: Requirements 3.2**

**Property 11: Vendor Approval Access Control**
*For any* vendor account, access to vendor management features should be granted if and only if the vendor has been approved by an Institution_Admin.
**Validates: Requirements 3.3, 3.5**

**Property 12: Vendor Deactivation Effect**
*For any* deactivated vendor account, all attempts to access vendor features should be rejected.
**Validates: Requirements 3.4**

### Product and Inventory Properties

**Property 13: Product Creation Completeness**
*For any* valid product data (name, description, price, category, stock), the system should successfully create the product with all provided fields stored correctly.
**Validates: Requirements 4.1**

**Property 14: Product Update Correctness**
*For any* existing product and any valid update data, the system should modify only the specified fields while preserving other fields.
**Validates: Requirements 4.2**

**Property 15: Stock Status Invariant**
*For any* product, if the stock quantity is zero, then the product's availability status should be false.
**Validates: Requirements 4.3**

**Property 16: Out-of-Stock Cart Prevention**
*For any* product marked as unavailable, attempts to add it to a shopping cart should be rejected.
**Validates: Requirements 4.4**

**Property 17: Low Stock Notification**
*For any* product whose stock falls below a defined threshold, a notification should be generated for the vendor.
**Validates: Requirements 4.5**

**Property 18: Product Image Storage**
*For any* uploaded product image, the system should store the image and return a retrievable URL.
**Validates: Requirements 4.6**

### Order Placement and Payment Properties

**Property 19: Institutional Product Isolation**
*For any* user, the product browsing results should contain only products from canteens belonging to the user's institution.
**Validates: Requirements 5.1**

**Property 20: Cart Item Storage**
*For any* product and quantity added to a cart, the cart should correctly store the product reference and quantity.
**Validates: Requirements 5.2**

**Property 21: Order Total Calculation**
*For any* shopping cart, the calculated total amount should equal the sum of (price × quantity) for all items in the cart.
**Validates: Requirements 5.3**

**Property 22: Payment-Order Invariant**
*For any* order in the system, there must exist a corresponding payment record with status "SUCCESS".
**Validates: Requirements 5.5, 5.8**

**Property 23: Failed Payment No-Order**
*For any* payment with status "FAILED" or "CANCELLED", no order should exist with that payment identifier.
**Validates: Requirements 5.6**

**Property 24: Order ID Uniqueness**
*For any* set of created orders, all order identifiers should be distinct.
**Validates: Requirements 5.7**

### Digital Bill Properties

**Property 25: Bill Generation Completeness**
*For any* confirmed payment, the system should generate a digital bill containing all required fields (order items, quantities, images, user name, payment timestamp, order ID, QR code).
**Validates: Requirements 6.1, 6.2, 6.7**

**Property 26: Bill Timer Initialization**
*For any* generated digital bill, the expiration timestamp should be exactly 15 minutes after the generation timestamp.
**Validates: Requirements 6.3**

**Property 27: Remaining Time Calculation**
*For any* digital bill at any point in time, the calculated remaining time should equal max(0, expiresAt - currentTime).
**Validates: Requirements 6.4**

**Property 28: Automatic Bill Expiration**
*For any* digital bill, if the current time is past the expiration timestamp, then the bill's validity flag should be false.
**Validates: Requirements 6.5, 14.1**

**Property 29: Invalid Bill Delivery Prevention**
*For any* digital bill with validity flag set to false, attempts to verify delivery should be rejected.
**Validates: Requirements 6.6, 14.3, 14.4**

**Property 30: Bill Expiration Notification**
*For any* digital bill that transitions to expired status, a notification should be generated for the user.
**Validates: Requirements 14.5**

### Vendor Order Management Properties

**Property 31: Active Order List Updates**
*For any* new order, the order should appear in the corresponding vendor's active order list.
**Validates: Requirements 7.1**

**Property 32: Combined Item List Aggregation**
*For any* vendor with a set of active orders, the combined item list should correctly sum quantities for each product across all orders.
**Validates: Requirements 7.2, 7.3**

**Property 33: Order Detail Completeness**
*For any* order in the vendor's view, all required details (user name, order time, items, quantities) should be present and correct.
**Validates: Requirements 7.4**

**Property 34: Order Timestamp Sorting**
*For any* list of orders, the orders should be sorted in ascending order by creation timestamp (oldest first).
**Validates: Requirements 7.5**

**Property 35: Delivered Order Removal**
*For any* order marked as delivered, the order should no longer appear in the vendor's active order list.
**Validates: Requirements 7.6**

### Delivery Verification Properties

**Property 36: QR Code Uniqueness**
*For any* set of generated digital bills, all QR codes and validation tokens should be unique.
**Validates: Requirements 8.3, 8.11**

**Property 37: QR Code Validity Check**
*For any* QR code scan attempt, the system should verify that the bill timer has not expired before processing delivery.
**Validates: Requirements 8.4, 8.5**

**Property 38: Delivery Status Update**
*For any* valid QR code scan, the order status should be updated to "DELIVERED".
**Validates: Requirements 8.6**

**Property 39: Timer Stop on Delivery**
*For any* order with status "DELIVERED", the countdown timer should be stopped (no longer decrementing).
**Validates: Requirements 8.7**

**Property 40: Order History Addition**
*For any* order marked as delivered, the order should appear in the user's order history.
**Validates: Requirements 8.8**

**Property 41: Combined List Reduction on Delivery**
*For any* order marked as delivered, the vendor's combined item list should be updated by subtracting the delivered quantities.
**Validates: Requirements 8.9**

**Property 42: Status Synchronization**
*For any* order status change, the updated status should be reflected in both user and vendor data views.
**Validates: Requirements 8.10**

**Property 43: QR Code Single-Use**
*For any* QR code that has been successfully scanned for delivery, subsequent scan attempts should be rejected.
**Validates: Requirements 8.11**

### Order History Properties

**Property 44: Order History Completeness**
*For any* user, their order history should contain all orders with status "DELIVERED" belonging to that user.
**Validates: Requirements 9.1**

**Property 45: History Entry Completeness**
*For any* order in the history, all required fields (date, items, quantities, total amount, vendor name) should be present.
**Validates: Requirements 9.2**

**Property 46: History Timestamp Sorting**
*For any* order history list, the orders should be sorted in descending order by date (most recent first).
**Validates: Requirements 9.3**

**Property 47: History Filtering Correctness**
*For any* filter criteria (date range or vendor), the filtered history should contain only orders matching the criteria.
**Validates: Requirements 9.4**

### Analytics Properties

**Property 48: Revenue Calculation Correctness**
*For any* time period, the calculated total revenue should equal the sum of all order amounts with timestamps within that period.
**Validates: Requirements 10.2**

**Property 49: Top Products Ranking**
*For any* top products list, the products should be sorted in descending order by total quantity sold.
**Validates: Requirements 10.3**

**Property 50: Order Volume Aggregation**
*For any* time period divided into buckets, the order volume for each bucket should equal the count of orders with timestamps in that bucket.
**Validates: Requirements 10.4**

**Property 51: CSV Export Completeness**
*For any* sales data export, the CSV should contain all sales records for the specified period with all required fields.
**Validates: Requirements 10.5**

### Real-Time Updates Properties

**Property 52: Stock Change Propagation**
*For any* product stock change, the product's availability status should immediately reflect the new stock level.
**Validates: Requirements 11.2**

**Property 53: New Order Notification**
*For any* newly created order, a notification should be generated for the corresponding vendor.
**Validates: Requirements 11.3**

### Security Properties

**Property 54: Password Encryption**
*For any* stored user password, the stored value should be a hash, not the plaintext password.
**Validates: Requirements 13.1**

**Property 55: Payment Data Protection**
*For any* stored payment record, the record should not contain complete payment card numbers.
**Validates: Requirements 13.3**

**Property 56: Session Expiration Enforcement**
*For any* expired session token, attempts to access protected resources should be rejected.
**Validates: Requirements 13.4**

**Property 57: Rate Limiting**
*For any* user making requests, if the request rate exceeds the defined limit, subsequent requests should be rejected.
**Validates: Requirements 13.5**

**Property 58: Authentication Audit Logging**
*For any* authentication attempt (successful or failed), a log entry should be created with timestamp, user identifier, and result.
**Validates: Requirements 13.6**

### User Profile Properties

**Property 59: Profile Data Retrieval**
*For any* user, the profile retrieval should return correct values for name, email, and institution.
**Validates: Requirements 15.1**

**Property 60: Active Order Display**
*For any* user with active orders, the dashboard should return all orders with status other than "DELIVERED" or "EXPIRED".
**Validates: Requirements 15.2**

**Property 61: User Statistics Calculation**
*For any* user, the calculated statistics (total orders, total spending) should correctly aggregate data from all the user's orders.
**Validates: Requirements 15.3**

**Property 62: Profile Update Constraints**
*For any* profile update request, updates to name and other fields should succeed, but attempts to update the institutional email should be rejected.
**Validates: Requirements 15.4**

## Error Handling

### Error Categories

**1. Authentication Errors:**
- Invalid credentials (401 Unauthorized)
- Expired session (401 Unauthorized)
- Invalid institutional email domain (400 Bad Request)
- Insufficient permissions (403 Forbidden)

**2. Validation Errors:**
- Missing required fields (400 Bad Request)
- Invalid data format (400 Bad Request)
- Out-of-stock product (400 Bad Request)
- Expired bill (400 Bad Request)

**3. Business Logic Errors:**
- Order without payment (400 Bad Request)
- Delivery on expired bill (400 Bad Request)
- Unapproved vendor access (403 Forbidden)
- Cross-institution access (403 Forbidden)

**4. Payment Errors:**
- Payment gateway timeout (504 Gateway Timeout)
- Payment failed (400 Bad Request)
- Payment cancelled (400 Bad Request)

**5. System Errors:**
- Database connection failure (500 Internal Server Error)
- External service unavailable (503 Service Unavailable)
- Rate limit exceeded (429 Too Many Requests)

### Error Response Format

All errors should follow a consistent JSON structure:

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: Date
  }
}
```

### Error Handling Strategies

**Retry Logic:**
- Payment gateway calls: 3 retries with exponential backoff
- Database queries: 2 retries with 100ms delay
- External API calls: 3 retries with exponential backoff

**Graceful Degradation:**
- If analytics service fails, return cached data
- If image upload fails, allow product creation without image
- If notification service fails, log error but don't block operation

**Transaction Management:**
- Order creation: Wrap payment verification and order creation in transaction
- Delivery confirmation: Wrap status update, timer stop, and history addition in transaction
- Stock updates: Use database-level locking to prevent race conditions

**Timeout Configuration:**
- API requests: 30 seconds
- Database queries: 5 seconds
- Payment gateway: 60 seconds
- WebSocket connections: Keep-alive every 30 seconds

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty carts, zero stock, boundary times)
- Error conditions (invalid inputs, failed payments, expired bills)
- Integration points between services

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: canteen-management-system, Property {number}: {property_text}**

### Property-Based Testing Library

**For TypeScript/JavaScript:** Use **fast-check**
- Mature library with excellent TypeScript support
- Rich set of built-in generators
- Shrinking support for minimal failing examples

**Configuration:**
```typescript
import fc from 'fast-check'

// Example property test configuration
fc.assert(
  fc.property(
    fc.emailAddress(),
    fc.string(),
    (email, domain) => {
      // Property test implementation
    }
  ),
  { numRuns: 100 } // Minimum 100 iterations
)
```

### Test Coverage Requirements

**Unit Test Coverage:**
- Authentication Service: 90%+
- Order Service: 95%+ (critical path)
- Payment Service: 95%+ (critical path)
- Bill Service: 95%+ (critical path)
- Other services: 85%+

**Property Test Coverage:**
- Each correctness property must have exactly one property-based test
- Properties 1-60 must all be implemented as property tests
- Each test must reference its design document property number

### Testing Workflow

**Development Phase:**
1. Write unit tests for specific examples
2. Implement feature to pass unit tests
3. Write property tests for universal properties
4. Run property tests to discover edge cases
5. Fix bugs found by property tests
6. Iterate until all tests pass

**CI/CD Pipeline:**
1. Run unit tests on every commit
2. Run property tests on every pull request
3. Run integration tests before deployment
4. Run load tests weekly on staging environment

### Test Data Generation

**For Property Tests:**
- Generate random users with various roles
- Generate random products with varying stock levels
- Generate random orders with different item combinations
- Generate random timestamps for timer testing
- Generate random email addresses with valid/invalid domains

**For Unit Tests:**
- Use fixtures for consistent test data
- Mock external services (payment gateway, notifications)
- Use in-memory database for fast test execution

### Critical Test Scenarios

**1. Payment-Order Invariant (Property 22):**
- Generate random carts and payment statuses
- Verify no order exists without successful payment
- Test concurrent order creation attempts

**2. Bill Timer Expiration (Properties 26, 28, 29):**
- Generate bills with various timestamps
- Test expiration at exact 15-minute boundary
- Test delivery attempts on expired bills

**3. QR Code Generation and Scanning (Properties 36, 37, 43):**
- Generate multiple bills and verify QR code uniqueness
- Test QR code scanning with valid and expired bills
- Test duplicate QR code scan prevention
- Verify validation token security

**4. Combined Item List (Property 32):**
- Generate multiple orders with overlapping products
- Verify aggregation correctness
- Test updates when orders are delivered

**5. Institutional Isolation (Property 19):**
- Generate users from different institutions
- Verify users only see their institution's products
- Test cross-institution access attempts

**6. Delivery Verification Workflow (Properties 37-42):**
- Test complete delivery flow with valid QR codes
- Test delivery rejection with expired bills
- Verify all side effects (status, history, combined list)
- Test QR code single-use enforcement

### Performance Testing

**Load Testing Scenarios:**
- 500 concurrent users per institution
- 100 orders per minute during peak hours
- Sustained load for 1 hour
- Spike testing: 2x normal load for 5 minutes

**Performance Metrics:**
- Order processing: < 3 seconds (p95)
- Database queries: < 500ms (p95)
- API response time: < 1 second (p95)
- WebSocket message delivery: < 2 seconds (p95)

**Tools:**
- Artillery or k6 for load testing
- New Relic or Datadog for monitoring
- PostgreSQL EXPLAIN for query optimization
