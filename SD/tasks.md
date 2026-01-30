# Implementation Plan: Canteen Management System

## Overview

This implementation plan breaks down the Canteen Management System into discrete, incremental coding tasks. The system will be built using TypeScript with Node.js backend, PostgreSQL database, Redis for caching, and React for the frontend. The implementation follows a bottom-up approach, starting with core services and data models, then building up to the complete workflow including the QR code-based delivery verification system.

## Tasks

- [x] 1. Set up project infrastructure and database schema
  - Initialize Node.js TypeScript project with Express/NestJS
  - Configure PostgreSQL database connection
  - Create all database tables (users, institutions, canteens, products, orders, order_items, payments)
  - Set up Redis connection for caching
  - Configure environment variables and secrets management
  - Set up testing framework (Jest) with fast-check for property-based testing
  - _Requirements: All requirements (infrastructure foundation)_

- [ ] 2. Implement Authentication Service
  - [x] 2.1 Create User model and authentication interfaces
    - Implement User interface with role enum
    - Create password hashing utilities (bcrypt)
    - Implement JWT token generation and validation
    - _Requirements: 1.3, 13.1_
  
  - [ ]* 2.2 Write property test for password encryption
    - **Property 54: Password Encryption**
    - **Validates: Requirements 13.1**
  
  - [x] 2.3 Implement user registration with email validation
    - Create registration endpoint
    - Implement institutional email domain validation
    - Store user with hashed password
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 2.4 Write property test for email validation
    - **Property 1: Institutional Email Validation**
    - **Validates: Requirements 1.1, 1.2**
  
  - [x] 2.5 Implement login and session management
    - Create login endpoint
    - Generate JWT tokens with role information
    - Implement session storage in Redis
    - _Requirements: 1.3, 13.4_
  
  - [ ]* 2.6 Write property test for role assignment
    - **Property 2: Role Assignment Correctness**
    - **Validates: Requirements 1.3**
  
  - [ ] 2.7 Implement authorization middleware
    - Create role-based access control middleware
    - Implement permission checking for routes
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 2.8 Write property test for authorization
    - **Property 3: Authorization Enforcement**
    - **Validates: Requirements 1.4, 1.5**
  
  - [ ]* 2.9 Write property test for session expiration
    - **Property 56: Session Expiration Enforcement**
    - **Validates: Requirements 13.4**
  
  - [ ]* 2.10 Implement rate limiting and audit logging
    - Add rate limiting middleware
    - Create authentication audit log
    - _Requirements: 13.5, 13.6_
  
  - [ ]* 2.11 Write property tests for security features
    - **Property 57: Rate Limiting**
    - **Property 58: Authentication Audit Logging**
    - **Validates: Requirements 13.5, 13.6**

- [ ] 3. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Institution Management Service
  - [ ] 4.1 Create Institution and Canteen models
    - Implement Institution interface and database operations
    - Implement Canteen interface and database operations
    - _Requirements: 2.1, 3.1_
  
  - [ ] 4.2 Implement institution creation by Main Admin
    - Create endpoint for institution creation
    - Generate unique institution identifiers
    - Store email domain for validation
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ]* 4.3 Write property tests for institution management
    - **Property 4: Institution Creation Completeness**
    - **Property 5: Institution ID Uniqueness**
    - **Property 8: Email Domain Configuration**
    - **Validates: Requirements 2.1, 2.2, 2.5**
  
  - [ ] 4.4 Implement Institution Admin credential assignment
    - Create endpoint for assigning Institution Admin role
    - Associate admin with institution
    - _Requirements: 2.3_
  
  - [ ]* 4.5 Write property test for admin assignment
    - **Property 6: Admin Credential Assignment**
    - **Validates: Requirements 2.3**
  
  - [ ] 4.6 Implement canteen registration
    - Create endpoint for canteen registration
    - Generate unique vendor IDs (SS1, SS2, etc.)
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 4.7 Write property tests for canteen management
    - **Property 9: Canteen Registration Completeness**
    - **Property 10: Vendor ID Uniqueness**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ] 4.8 Implement vendor approval workflow
    - Create endpoint for vendor approval
    - Implement access control based on approval status
    - _Requirements: 3.3, 3.5_
  
  - [ ]* 4.9 Write property test for vendor approval
    - **Property 11: Vendor Approval Access Control**
    - **Validates: Requirements 3.3, 3.5**
  
  - [ ] 4.10 Implement vendor deactivation
    - Create endpoint for vendor deactivation
    - Revoke vendor access on deactivation
    - _Requirements: 3.4_
  
  - [ ]* 4.11 Write property test for vendor deactivation
    - **Property 12: Vendor Deactivation Effect**
    - **Validates: Requirements 3.4**
  
  - [ ] 4.12 Implement platform-level analytics
    - Create endpoint for platform statistics
    - Aggregate data across all institutions
    - _Requirements: 2.4_
  
  - [ ]* 4.13 Write property test for platform statistics
    - **Property 7: Platform Statistics Aggregation**
    - **Validates: Requirements 2.4**

- [ ] 5. Checkpoint - Ensure institution management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Product and Inventory Service
  - [ ] 6.1 Create Product model and interfaces
    - Implement Product interface
    - Create database operations for products
    - _Requirements: 4.1_
  
  - [ ] 6.2 Implement product creation
    - Create endpoint for product creation
    - Handle image upload to S3/storage
    - _Requirements: 4.1, 4.6_
  
  - [ ]* 6.3 Write property tests for product creation
    - **Property 13: Product Creation Completeness**
    - **Property 18: Product Image Storage**
    - **Validates: Requirements 4.1, 4.6**
  
  - [ ] 6.4 Implement product updates
    - Create endpoint for product updates
    - Validate update data
    - _Requirements: 4.2_
  
  - [ ]* 6.5 Write property test for product updates
    - **Property 14: Product Update Correctness**
    - **Validates: Requirements 4.2**
  
  - [ ] 6.6 Implement stock management
    - Create endpoint for stock updates
    - Implement automatic availability status based on stock
    - Add low stock notification logic
    - _Requirements: 4.3, 4.5_
  
  - [ ]* 6.7 Write property tests for stock management
    - **Property 15: Stock Status Invariant**
    - **Property 17: Low Stock Notification**
    - **Validates: Requirements 4.3, 4.5**
  
  - [ ] 6.8 Implement product browsing with institutional isolation
    - Create endpoint for product listing
    - Filter products by user's institution
    - Cache product listings in Redis
    - _Requirements: 5.1_
  
  - [ ]* 6.9 Write property test for institutional isolation
    - **Property 19: Institutional Product Isolation**
    - **Validates: Requirements 5.1**
  
  - [ ] 6.10 Implement cart validation
    - Validate product availability before adding to cart
    - Prevent out-of-stock items from being added
    - _Requirements: 4.4_
  
  - [ ]* 6.11 Write property test for cart validation
    - **Property 16: Out-of-Stock Cart Prevention**
    - **Validates: Requirements 4.4**

- [ ] 7. Checkpoint - Ensure product management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Payment Service
  - [ ] 8.1 Create Payment model and interfaces
    - Implement Payment interface
    - Create database operations for payments
    - _Requirements: 5.4_
  
  - [ ] 8.2 Integrate UPI payment gateway
    - Set up payment gateway SDK
    - Implement payment initiation
    - Implement payment verification webhook
    - _Requirements: 5.4, 5.5_
  
  - [ ] 8.3 Implement payment status tracking
    - Create endpoint for payment status
    - Handle payment success, failure, and cancellation
    - _Requirements: 5.6_
  
  - [ ]* 8.4 Write property test for payment data protection
    - **Property 55: Payment Data Protection**
    - **Validates: Requirements 13.3**

- [ ] 9. Implement Order Service
  - [ ] 9.1 Create Order and OrderItem models
    - Implement Order interface
    - Implement OrderItem interface
    - Create database operations
    - _Requirements: 5.7_
  
  - [ ] 9.2 Implement shopping cart functionality
    - Create cart storage in Redis
    - Implement add/remove/update cart items
    - _Requirements: 5.2_
  
  - [ ]* 9.3 Write property test for cart storage
    - **Property 20: Cart Item Storage**
    - **Validates: Requirements 5.2**
  
  - [ ] 9.4 Implement order total calculation
    - Calculate total from cart items
    - Validate prices against current product prices
    - _Requirements: 5.3_
  
  - [ ]* 9.5 Write property test for order total
    - **Property 21: Order Total Calculation**
    - **Validates: Requirements 5.3**
  
  - [ ] 9.6 Implement order creation with payment verification
    - Create endpoint for order placement
    - Verify payment before creating order
    - Generate unique order IDs
    - Use database transaction for atomicity
    - _Requirements: 5.5, 5.7, 5.8_
  
  - [ ]* 9.7 Write property tests for payment-order invariant
    - **Property 22: Payment-Order Invariant**
    - **Property 23: Failed Payment No-Order**
    - **Property 24: Order ID Uniqueness**
    - **Validates: Requirements 5.5, 5.6, 5.7, 5.8**

- [ ] 10. Checkpoint - Ensure order creation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Digital Bill Service with QR Code
  - [ ] 11.1 Create DigitalBill model and QR code generation
    - Implement DigitalBill interface
    - Integrate QR code generation library (qrcode)
    - Generate unique validation tokens
    - _Requirements: 6.1, 6.7_
  
  - [ ] 11.2 Implement bill generation after payment
    - Create bill generation function
    - Set 15-minute expiration timer
    - Generate QR code with order ID and validation token
    - Store bill data in database and cache
    - _Requirements: 6.1, 6.2, 6.3, 6.7_
  
  - [ ]* 11.3 Write property tests for bill generation
    - **Property 25: Bill Generation Completeness**
    - **Property 26: Bill Timer Initialization**
    - **Property 36: QR Code Uniqueness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.7**
  
  - [ ] 11.4 Implement bill timer and expiration logic
    - Create background job for bill expiration
    - Implement remaining time calculation
    - Mark bills as expired when timer reaches zero
    - _Requirements: 6.4, 6.5, 14.1_
  
  - [ ]* 11.5 Write property tests for bill expiration
    - **Property 27: Remaining Time Calculation**
    - **Property 28: Automatic Bill Expiration**
    - **Validates: Requirements 6.4, 6.5, 14.1**
  
  - [ ] 11.6 Implement bill expiration notification
    - Send notification when bill expires
    - _Requirements: 14.5_
  
  - [ ]* 11.7 Write property test for expiration notification
    - **Property 30: Bill Expiration Notification**
    - **Validates: Requirements 14.5**
  
  - [ ] 11.8 Implement QR code scanning and verification
    - Create endpoint for QR code scanning
    - Decode QR code data
    - Verify validation token
    - Check bill validity before processing
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 11.9 Write property tests for QR verification
    - **Property 29: Invalid Bill Delivery Prevention**
    - **Property 37: QR Code Validity Check**
    - **Validates: Requirements 6.6, 8.4, 8.5, 14.3, 14.4**
  
  - [ ] 11.10 Implement delivery confirmation
    - Update order status to DELIVERED
    - Stop countdown timer
    - Prevent duplicate QR code scans
    - Use database transaction for atomicity
    - _Requirements: 8.6, 8.7, 8.11_
  
  - [ ]* 11.11 Write property tests for delivery confirmation
    - **Property 38: Delivery Status Update**
    - **Property 39: Timer Stop on Delivery**
    - **Property 43: QR Code Single-Use**
    - **Validates: Requirements 8.6, 8.7, 8.11**

- [ ] 12. Checkpoint - Ensure bill and QR code tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement Vendor Order Management
  - [ ] 13.1 Implement active order list for vendors
    - Create endpoint for vendor's active orders
    - Filter orders by vendor ID and status
    - Sort by timestamp (oldest first)
    - _Requirements: 7.1, 7.5_
  
  - [ ]* 13.2 Write property tests for order list
    - **Property 31: Active Order List Updates**
    - **Property 34: Order Timestamp Sorting**
    - **Validates: Requirements 7.1, 7.5**
  
  - [ ] 13.3 Implement combined item list aggregation
    - Create endpoint for combined item list
    - Aggregate quantities across all active orders
    - Cache combined list in Redis
    - Update cache on new orders and deliveries
    - _Requirements: 7.2, 7.3_
  
  - [ ]* 13.4 Write property test for combined item list
    - **Property 32: Combined Item List Aggregation**
    - **Validates: Requirements 7.2, 7.3**
  
  - [ ] 13.5 Implement order detail view
    - Create endpoint for individual order details
    - Include all required fields (user name, time, items)
    - _Requirements: 7.4_
  
  - [ ]* 13.6 Write property test for order details
    - **Property 33: Order Detail Completeness**
    - **Validates: Requirements 7.4**
  
  - [ ] 13.7 Implement order removal from active list on delivery
    - Update active order list when status changes to DELIVERED
    - Update combined item list by reducing quantities
    - _Requirements: 7.6, 8.9_
  
  - [ ]* 13.8 Write property tests for delivery updates
    - **Property 35: Delivered Order Removal**
    - **Property 41: Combined List Reduction on Delivery**
    - **Validates: Requirements 7.6, 8.9**

- [ ] 14. Implement Order History
  - [ ] 14.1 Create order history endpoint
    - Filter orders by user ID and DELIVERED status
    - Sort by date (most recent first)
    - Include all required fields
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 14.2 Write property tests for order history
    - **Property 44: Order History Completeness**
    - **Property 45: History Entry Completeness**
    - **Property 46: History Timestamp Sorting**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  
  - [ ] 14.3 Implement order history filtering
    - Add filters for date range and vendor
    - _Requirements: 9.4_
  
  - [ ]* 14.4 Write property test for history filtering
    - **Property 47: History Filtering Correctness**
    - **Validates: Requirements 9.4**
  
  - [ ] 14.5 Implement order history addition on delivery
    - Ensure delivered orders appear in history
    - _Requirements: 8.8_
  
  - [ ]* 14.6 Write property test for history addition
    - **Property 40: Order History Addition**
    - **Validates: Requirements 8.8**

- [ ] 15. Implement Analytics Service
  - [ ] 15.1 Create sales report generation
    - Implement daily, weekly, monthly report logic
    - Calculate total revenue for time periods
    - _Requirements: 10.1, 10.2_
  
  - [ ]* 15.2 Write property test for revenue calculation
    - **Property 48: Revenue Calculation Correctness**
    - **Validates: Requirements 10.2**
  
  - [ ] 15.3 Implement top products ranking
    - Aggregate product quantities sold
    - Sort by quantity descending
    - _Requirements: 10.3_
  
  - [ ]* 15.4 Write property test for product ranking
    - **Property 49: Top Products Ranking**
    - **Validates: Requirements 10.3**
  
  - [ ] 15.5 Implement order volume trends
    - Calculate order counts per time bucket
    - _Requirements: 10.4_
  
  - [ ]* 15.6 Write property test for volume aggregation
    - **Property 50: Order Volume Aggregation**
    - **Validates: Requirements 10.4**
  
  - [ ] 15.7 Implement CSV export
    - Generate CSV from sales data
    - Include all required fields
    - _Requirements: 10.5_
  
  - [ ]* 15.8 Write property test for CSV export
    - **Property 51: CSV Export Completeness**
    - **Validates: Requirements 10.5**

- [ ] 16. Implement User Profile and Dashboard
  - [ ] 16.1 Create profile retrieval endpoint
    - Return user profile data
    - _Requirements: 15.1_
  
  - [ ]* 16.2 Write property test for profile retrieval
    - **Property 59: Profile Data Retrieval**
    - **Validates: Requirements 15.1**
  
  - [ ] 16.3 Implement active orders display
    - Filter user's orders by non-delivered status
    - _Requirements: 15.2_
  
  - [ ]* 16.4 Write property test for active orders
    - **Property 60: Active Order Display**
    - **Validates: Requirements 15.2**
  
  - [ ] 16.5 Implement user statistics
    - Calculate total orders and spending
    - _Requirements: 15.3_
  
  - [ ]* 16.6 Write property test for user statistics
    - **Property 61: User Statistics Calculation**
    - **Validates: Requirements 15.3**
  
  - [ ] 16.7 Implement profile update
    - Allow updates to name and other fields
    - Prevent institutional email updates
    - _Requirements: 15.4_
  
  - [ ]* 16.8 Write property test for profile updates
    - **Property 62: Profile Update Constraints**
    - **Validates: Requirements 15.4**

- [ ] 17. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement WebSocket Manager for Real-Time Updates
  - [ ] 18.1 Set up WebSocket server
    - Configure Socket.io
    - Implement connection management
    - _Requirements: 11.5_
  
  - [ ] 18.2 Implement order status broadcast
    - Broadcast status changes to user and vendor
    - _Requirements: 8.10, 11.1_
  
  - [ ]* 18.3 Write property test for status synchronization
    - **Property 42: Status Synchronization**
    - **Validates: Requirements 8.10**
  
  - [ ] 18.4 Implement stock change notifications
    - Broadcast stock updates to all users
    - _Requirements: 11.2_
  
  - [ ]* 18.5 Write property test for stock propagation
    - **Property 52: Stock Change Propagation**
    - **Validates: Requirements 11.2**
  
  - [ ] 18.6 Implement new order notifications
    - Notify vendors of new orders
    - _Requirements: 11.3_
  
  - [ ]* 18.7 Write property test for order notifications
    - **Property 53: New Order Notification**
    - **Validates: Requirements 11.3**
  
  - [ ] 18.8 Implement bill timer updates
    - Send timer countdown updates to users
    - _Requirements: 6.4, 11.4_

- [ ] 19. Implement Frontend - User Interface
  - [ ] 19.1 Set up React project with TypeScript
    - Initialize React app
    - Configure routing (React Router)
    - Set up state management (Redux/Zustand)
    - Configure WebSocket client
  
  - [ ] 19.2 Implement authentication pages
    - Create login page
    - Create registration page with email validation
    - Implement JWT token storage
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 19.3 Implement product browsing page
    - Display products from user's institution
    - Show product images, prices, availability
    - Implement add to cart functionality
    - _Requirements: 5.1, 5.2_
  
  - [ ] 19.4 Implement shopping cart page
    - Display cart items with quantities
    - Show order total
    - Implement checkout button
    - _Requirements: 5.2, 5.3_
  
  - [ ] 19.5 Implement payment integration
    - Integrate UPI payment gateway UI
    - Handle payment success/failure
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [ ] 19.6 Implement digital bill display
    - Show order details with images
    - Display 15-minute countdown timer
    - Display QR code for scanning
    - Update timer in real-time via WebSocket
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_
  
  - [ ] 19.7 Implement order history page
    - Display completed orders
    - Implement date range and vendor filters
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 19.8 Implement user dashboard
    - Display profile information
    - Show active orders with status
    - Display user statistics
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ] 19.9 Implement profile management
    - Allow profile updates
    - Prevent email changes
    - _Requirements: 15.4_

- [ ] 20. Implement Frontend - Vendor Panel
  - [ ] 20.1 Set up vendor panel React app
    - Initialize separate React app for vendors
    - Configure routing and state management
    - Configure WebSocket client
  
  - [ ] 20.2 Implement vendor authentication
    - Create vendor login page
    - Implement role-based access
    - _Requirements: 1.3, 1.4, 3.3_
  
  - [ ] 20.3 Implement product management interface
    - Create product listing page
    - Implement add/edit product forms
    - Implement image upload
    - Show stock levels with alerts
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_
  
  - [ ] 20.4 Implement active orders view
    - Display active orders sorted by time
    - Show order details
    - Update in real-time via WebSocket
    - _Requirements: 7.1, 7.4, 7.5_
  
  - [ ] 20.5 Implement combined item list view
    - Display aggregated items across orders
    - Update in real-time as orders arrive/complete
    - _Requirements: 7.2, 7.3_
  
  - [ ] 20.6 Implement QR code scanner
    - Integrate camera access
    - Implement QR code scanning library
    - Display scan results and errors
    - Update order status on successful scan
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 20.7 Implement analytics dashboard
    - Display sales reports (daily, weekly, monthly)
    - Show top products
    - Display order volume trends
    - Implement CSV export
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 21. Implement Frontend - Admin Panels
  - [ ] 21.1 Implement Main Admin panel
    - Create institution management interface
    - Display platform-level statistics
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 21.2 Implement Institution Admin panel
    - Create canteen registration interface
    - Implement vendor approval workflow
    - Display vendor management
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 22. Final Integration and Testing
  - [ ] 22.1 Integration testing
    - Test complete order flow from browsing to delivery
    - Test QR code generation and scanning workflow
    - Test real-time updates across all interfaces
    - Test concurrent user scenarios
  
  - [ ] 22.2 End-to-end testing
    - Test all user roles and workflows
    - Test error scenarios (expired bills, failed payments)
    - Test edge cases (stock depletion, timer boundaries)
  
  - [ ] 22.3 Performance testing
    - Load test with 500 concurrent users
    - Test 100 orders per minute throughput
    - Verify response times meet requirements
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 23. Final Checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The QR code workflow is central to delivery verification and fraud prevention
- Real-time synchronization via WebSocket ensures consistent state across all interfaces
- Database transactions ensure atomicity for critical operations (order creation, delivery confirmation)
