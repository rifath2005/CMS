# Requirements Document: Canteen Management System

## Introduction

The Canteen Management System is a campus-scale digital platform designed to streamline canteen operations, reduce wait times, manage crowds, and ensure payment authenticity through a time-bound digital billing workflow. The system operates in a closed campus environment with institutional email authentication, prepaid UPI orders, and a unique delivery verification mechanism where vendors confirm delivery directly on the user's device.

## Glossary

- **System**: The Canteen Management System platform
- **Main_Admin**: Platform-level administrator who manages institutions
- **Institution_Admin**: Campus-level administrator who manages canteens and vendors
- **Vendor**: Canteen operator who manages products and fulfills orders
- **User**: Student or staff member who places orders
- **Digital_Bill**: Time-bound order confirmation with 15-minute validity timer
- **Combined_Item_List**: Aggregated view of all items across active orders for vendor preparation
- **Institutional_Email**: Email address belonging to the registered institution domain
- **Delivery_Verification**: Process where vendor clicks "Delivered" on user's device after physical handover
- **Order_History**: Archive of completed orders with timestamps and status

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a system user, I want secure role-based access control, so that only authorized institutional users can access appropriate system features.

#### Acceptance Criteria

1. WHEN a user attempts to register, THE System SHALL validate that the email address belongs to a registered institutional domain
2. WHEN a user with an invalid email domain attempts to register, THE System SHALL reject the registration and display an error message
3. WHEN a user logs in, THE System SHALL authenticate credentials and assign the appropriate role (Main_Admin, Institution_Admin, Vendor, or User)
4. WHEN an authenticated user accesses a feature, THE System SHALL verify that the user's role has permission for that feature
5. IF a user attempts to access unauthorized features, THEN THE System SHALL deny access and return an authorization error

### Requirement 2: Institution Management

**User Story:** As a Main Admin, I want to create and manage institution accounts, so that I can onboard new campuses to the platform.

#### Acceptance Criteria

1. THE Main_Admin SHALL create new institution accounts with name, domain, and contact information
2. WHEN a Main_Admin creates an institution, THE System SHALL generate a unique institution identifier
3. THE Main_Admin SHALL assign Institution_Admin credentials for each institution
4. THE Main_Admin SHALL view platform-level usage statistics across all institutions
5. WHEN an institution is created, THE System SHALL configure the email domain for user validation

### Requirement 3: Canteen and Vendor Management

**User Story:** As an Institution Admin, I want to register canteens and manage vendors, so that I can control which vendors operate on campus.

#### Acceptance Criteria

1. THE Institution_Admin SHALL register canteens with name, location, and operating hours
2. WHEN a canteen is registered, THE System SHALL assign a unique vendor identifier (e.g., SS1, SS2)
3. THE Institution_Admin SHALL approve vendor accounts before they can access the system
4. THE Institution_Admin SHALL deactivate or remove vendor accounts when needed
5. WHEN a vendor is approved, THE System SHALL grant access to vendor management features

### Requirement 4: Product and Inventory Management

**User Story:** As a Vendor, I want to manage my products and inventory, so that users can only order available items.

#### Acceptance Criteria

1. THE Vendor SHALL create products with name, description, price, category, and stock quantity
2. THE Vendor SHALL update product information including prices and availability status
3. WHEN a product's stock reaches zero, THE System SHALL mark the product as out-of-stock
4. WHEN a product is out-of-stock, THE System SHALL prevent users from adding it to their cart
5. THE Vendor SHALL receive notifications when products are running low on stock
6. THE Vendor SHALL upload product images that are displayed to users

### Requirement 5: Order Placement and Payment

**User Story:** As a User, I want to place prepaid orders using UPI, so that I can secure my order before pickup.

#### Acceptance Criteria

1. THE User SHALL browse products only from canteens registered under their institution
2. THE User SHALL add products to a shopping cart with specified quantities
3. WHEN a User submits an order, THE System SHALL calculate the total amount including all items
4. THE System SHALL integrate with UPI payment gateway for payment processing
5. WHEN payment is initiated, THE System SHALL verify payment completion before creating the order
6. IF payment fails or is cancelled, THEN THE System SHALL not create an order and SHALL notify the user
7. WHEN payment is confirmed, THE System SHALL create the order with a unique order identifier
8. THE System SHALL prevent order creation without successful payment verification

### Requirement 6: Digital Bill Generation

**User Story:** As a User, I want to receive a time-bound digital bill after payment, so that I can verify my order and collect it within the validity period.

#### Acceptance Criteria

1. WHEN payment is confirmed, THE System SHALL generate a digital bill with order details
2. THE Digital_Bill SHALL include: order items, quantities, product images, user name, payment timestamp, and order identifier
3. WHEN a Digital_Bill is generated, THE System SHALL start a 15-minute countdown timer
4. THE Digital_Bill SHALL display the remaining time in real-time
5. WHEN the 15-minute timer expires, THE System SHALL mark the bill as invalid
6. WHEN a bill is invalid, THE System SHALL prevent delivery verification
7. WHEN a Digital_Bill is generated, THE System SHALL generate a unique QR code containing the order identifier and validation token

### Requirement 7: Vendor Order Management

**User Story:** As a Vendor, I want to view all active orders in a combined preparation list, so that I can efficiently prepare multiple orders.

#### Acceptance Criteria

1. WHEN a new order is placed, THE System SHALL add the order to the Vendor's active order list
2. THE Vendor SHALL view a Combined_Item_List that aggregates quantities across all active orders
3. WHEN a new order arrives, THE System SHALL update the Combined_Item_List in real-time
4. THE Vendor SHALL view individual order details including user name and order time
5. THE System SHALL sort orders by timestamp with oldest orders displayed first
6. WHEN an order is delivered, THE System SHALL remove it from the active order list

### Requirement 8: Delivery Verification Workflow

**User Story:** As a Vendor, I want to verify delivery by scanning the user's QR code, so that order status is accurately tracked and prevents fraud.

#### Acceptance Criteria

1. THE Vendor SHALL have access to a QR code scanner in the vendor panel
2. WHEN a User shows their Digital_Bill QR code, THE Vendor SHALL scan it using the vendor panel camera
3. WHEN the QR code is scanned, THE System SHALL decode the order identifier and validation token
4. THE System SHALL verify the bill timer has not expired before processing delivery
5. IF the timer has expired, THEN THE System SHALL reject the scan and display an error to the vendor
6. WHEN a valid QR code is scanned, THE System SHALL update the order status to "Delivered"
7. WHEN order status changes to "Delivered", THE System SHALL stop the countdown timer
8. WHEN an order is delivered, THE System SHALL move it to the User's Order_History
9. WHEN an order is delivered, THE System SHALL update the Vendor's Combined_Item_List by reducing delivered quantities
10. THE System SHALL synchronize status updates between User and Vendor interfaces in real-time
11. THE System SHALL prevent the same QR code from being scanned multiple times for delivery confirmation

### Requirement 9: Order History and Analytics

**User Story:** As a User, I want to view my order history, so that I can track my past purchases.

#### Acceptance Criteria

1. THE User SHALL view all completed orders in their Order_History
2. THE Order_History SHALL display order date, items, quantities, total amount, and vendor name
3. THE System SHALL sort Order_History with most recent orders first
4. THE User SHALL filter Order_History by date range or vendor

### Requirement 10: Vendor Analytics and Reporting

**User Story:** As a Vendor, I want to view sales analytics, so that I can understand business performance and trends.

#### Acceptance Criteria

1. THE Vendor SHALL view sales reports for daily, weekly, and monthly periods
2. THE System SHALL calculate total revenue for selected time periods
3. THE System SHALL display top-selling products with quantities sold
4. THE System SHALL show order volume trends over time
5. THE Vendor SHALL export sales data in CSV format

### Requirement 11: Real-Time Synchronization

**User Story:** As a system user, I want real-time updates across all interfaces, so that information is always current and accurate.

#### Acceptance Criteria

1. WHEN an order status changes, THE System SHALL update all affected user and vendor interfaces within 2 seconds
2. WHEN a product's stock changes, THE System SHALL update the product availability for all users immediately
3. WHEN a new order is placed, THE System SHALL notify the vendor in real-time
4. WHEN the Digital_Bill timer counts down, THE System SHALL update the displayed time every second
5. THE System SHALL maintain WebSocket connections for real-time communication

### Requirement 12: System Scalability and Performance

**User Story:** As a system administrator, I want the system to handle peak loads, so that users experience consistent performance during busy hours.

#### Acceptance Criteria

1. THE System SHALL support at least 500 concurrent users per institution
2. WHEN multiple orders are placed simultaneously, THE System SHALL process each order within 3 seconds
3. THE System SHALL handle at least 100 orders per minute during peak hours
4. WHEN database queries are executed, THE System SHALL return results within 500 milliseconds
5. THE System SHALL implement caching for frequently accessed data such as product listings

### Requirement 13: Data Security and Privacy

**User Story:** As a User, I want my personal and payment information protected, so that my data remains secure.

#### Acceptance Criteria

1. THE System SHALL encrypt all sensitive data including passwords and payment information
2. THE System SHALL use HTTPS for all client-server communication
3. THE System SHALL not store complete payment card details
4. WHEN a user session expires, THE System SHALL require re-authentication
5. THE System SHALL implement rate limiting to prevent brute force attacks
6. THE System SHALL log all authentication attempts for security auditing

### Requirement 14: Bill Expiration and Validation

**User Story:** As a system administrator, I want expired bills to be automatically invalidated, so that the 15-minute constraint is strictly enforced.

#### Acceptance Criteria

1. WHEN a Digital_Bill timer reaches zero, THE System SHALL mark the bill as expired
2. WHEN a bill is expired, THE System SHALL disable the "Delivered" button
3. IF a vendor attempts to confirm delivery on an expired bill, THEN THE System SHALL reject the action and display an error
4. THE System SHALL check bill validity before processing any delivery confirmation
5. WHEN a bill expires, THE System SHALL notify the user and provide options to reorder or contact support

### Requirement 15: User Profile and Dashboard

**User Story:** As a User, I want to view my profile and order dashboard, so that I can manage my account and track orders.

#### Acceptance Criteria

1. THE User SHALL view their profile information including name, email, and institution
2. THE User SHALL view active orders with current status and timer
3. THE User SHALL view quick statistics including total orders and total spending
4. THE User SHALL update their profile information except institutional email
5. THE System SHALL display the user's current active order prominently on the dashboard
