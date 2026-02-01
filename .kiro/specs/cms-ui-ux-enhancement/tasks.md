# Implementation Plan

- [x] 1. Set up design system foundation





  - Create Tailwind configuration extensions with 8px grid spacing system, semantic colors, and transition durations
  - Create shared components directory structure (src/components/shared/)
  - Set up fast-check library for property-based testing
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.1 Write property test for semantic color consistency


  - **Property 1: Semantic color consistency for status indicators**
  - **Validates: Requirements 1.2, 3.3**

- [x] 1.2 Write property test for minimum contrast ratio compliance


  - **Property 2: Minimum contrast ratio compliance**
  - **Validates: Requirements 1.4**

- [x] 1.3 Write property test for touch target minimum size

  - **Property 3: Touch target minimum size**
  - **Validates: Requirements 1.5, 6.5**

- [x] 2. Create shared component library





  - Implement KPICard component with hover elevation and responsive sizing
  - Implement StatusChip component with semantic color mapping and size variants
  - Implement DataTable component with sticky headers, zebra striping, and hover actions
  - Implement StepDrawer component with multi-step navigation and progress indicator
  - Implement CountdownTimer component with color progression logic
  - _Requirements: 2.3, 2.4, 3.3, 3.4, 4.6, 12.3, 12.4, 12.5_

- [x] 2.1 Write property test for responsive layout adaptation


  - **Property 4: Responsive layout adaptation**
  - **Validates: Requirements 1.6, 14.5**

- [x] 2.2 Write property test for KPI card hover elevation


  - **Property 5: KPI card hover elevation**
  - **Validates: Requirements 2.4**

- [x] 2.3 Write property test for table row hover action reveal


  - **Property 6: Table row hover action reveal**
  - **Validates: Requirements 3.4**

- [x] 2.4 Write property test for zebra striping consistency


  - **Property 10: Zebra striping consistency**
  - **Validates: Requirements 4.6**

- [x] 2.5 Write property test for countdown timer color progression


  - **Property 22: Countdown timer color progression**
  - **Validates: Requirements 12.3, 12.4, 12.5**

- [ ] 3. Refactor Super Admin Panel dashboard
  - Update PlatformStats page to use 12-column responsive grid layout
  - Replace existing stat cards with new KPICard components for Total Institutions, Active Institutions, Active Vendors, and Total Orders Today
  - Add trend indicators to KPI cards where applicable
  - Optimize dashboard scroll depth to maximum 2 viewport heights
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3.1 Write unit tests for Super Admin dashboard KPI cards
  - Test KPI card rendering with correct data
  - Test responsive grid layout at different breakpoints
  - _Requirements: 2.1, 2.2_

- [ ] 4. Refactor Super Admin institution management
  - Update Institutions page to use DataTable component with sticky headers
  - Implement status chips for institution status display (active, inactive, pending)
  - Add hover-revealed action buttons to table rows
  - Convert CreateInstitutionModal to StepDrawer with three steps: Basic Info, Contact & Domain, Admin Assignment
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4.1 Write property test for modal nesting prevention
  - **Property 7: Modal nesting prevention**
  - **Validates: Requirements 3.6, 8.5**

- [ ] 4.2 Write unit tests for institution table
  - Test sticky header behavior during scroll
  - Test status chip color mapping
  - Test hover action reveal
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Refactor Institution Admin Panel dashboard
  - Update dashboard to display overview cards for Active Canteens, Pending Vendor Approvals, Orders Today, and Low-stock Alerts
  - Organize vendor display into three status-based sections: Pending Approval, Active Vendors, Deactivated Vendors
  - Implement vendor cards with Vendor ID, Canteen Name, Approval State, and Primary Action Button
  - Ensure approval actions are reachable within 2 clicks
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6.1 Write property test for vendor card content completeness
  - **Property 8: Vendor card content completeness**
  - **Validates: Requirements 4.3**

- [ ] 6.2 Write unit tests for Institution Admin dashboard
  - Test overview card rendering
  - Test vendor section organization
  - Test approval action click path
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 7. Enhance Institution Admin vendor management
  - Implement instant visual feedback for vendor status changes without page reload
  - Apply zebra striping to all data tables
  - Add inline action buttons (Approve, Deactivate) to table rows
  - _Requirements: 4.5, 4.6, 5.4_

- [ ] 7.1 Write property test for status change visual feedback
  - **Property 9: Status change visual feedback**
  - **Validates: Requirements 4.5**

- [ ] 8. Refactor Institution Admin canteen registration
  - Organize canteen registration form into three sections: Identity, Location, Operating Hours
  - Implement visual highlighting for auto-generated Vendor ID (read-only with border/background)
  - Apply sticky headers to all tables in Institution Admin Panel
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8.1 Write property test for read-only field visual distinction
  - **Property 11: Read-only field visual distinction**
  - **Validates: Requirements 5.2**

- [ ] 8.2 Write property test for sticky header persistence
  - **Property 12: Sticky header persistence**
  - **Validates: Requirements 5.3**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Refactor Vendor Panel active orders view
  - Implement split layout with Active Orders list (40% left) and Order Details (60% right)
  - Sort active orders with oldest first
  - Update order cards to prominently show User Name, Order Time, and Status Chip
  - Add subtle fade/slide animation for status transitions
  - Ensure all interactive elements meet 44px minimum touch target size
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10.1 Write property test for order card content completeness
  - **Property 13: Order card content completeness**
  - **Validates: Requirements 6.3**

- [ ] 10.2 Write property test for status transition animation
  - **Property 14: Status transition animation**
  - **Validates: Requirements 6.4**

- [ ] 10.3 Write unit tests for Vendor active orders view
  - Test split layout rendering
  - Test order sorting (oldest first)
  - Test touch target sizes
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 11. Implement Vendor Panel combined item list
  - Create dedicated screen or pinned section for combined item list
  - Render item quantities with visual dominance (larger font size and weight)
  - Group items by category where categories exist
  - Add auto-refresh pulse/dot indicator
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11.1 Write property test for combined item quantity visual dominance
  - **Property 15: Combined item quantity visual dominance**
  - **Validates: Requirements 7.2**

- [ ] 11.2 Write property test for category-based item grouping
  - **Property 16: Category-based item grouping**
  - **Validates: Requirements 7.3**

- [ ] 11.3 Write property test for auto-refresh indicator visibility
  - **Property 17: Auto-refresh indicator visibility**
  - **Validates: Requirements 7.4**

- [ ] 12. Refactor Vendor Panel QR scanner interface
  - Implement fullscreen camera-first QR scanner UI
  - Add single primary "Scan" action button
  - Implement green confirmation screen on success with 2-second auto-return
  - Display clear error messages with failure reasons (expired, invalid) on failure
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12.1 Write property test for QR scan error message clarity
  - **Property 18: QR scan error message clarity**
  - **Validates: Requirements 8.4**

- [ ] 12.2 Write unit tests for QR scanner interface
  - Test fullscreen layout
  - Test success flow and auto-return timing
  - Test error display
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 13. Enhance Vendor Panel inventory management
  - Implement inline stock editing capability
  - Add visual emphasis for low-stock warnings (color and icon)
  - Clearly disable unavailable items with reduced opacity
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 13.1 Write property test for low-stock visual emphasis
  - **Property 19: Low-stock visual emphasis**
  - **Validates: Requirements 9.2**

- [ ] 13.2 Write property test for unavailable item disabled state
  - **Property 20: Unavailable item disabled state**
  - **Validates: Requirements 9.3, 10.2**

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Refactor Student Panel product browsing
  - Update Products page to use card-based layout optimized for mobile
  - Render out-of-stock products as disabled with greyed appearance and reduced opacity
  - Implement category filters as horizontal scrollable chips
  - Apply consistent 8px grid spacing to product cards
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 15.1 Write unit tests for Student product browsing
  - Test card-based layout rendering
  - Test out-of-stock product styling
  - Test category filter chips
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 16. Refactor Student Panel cart and checkout
  - Implement sticky order summary that remains visible during scroll
  - Display clear price breakdown (subtotal, taxes, total)
  - Add distinct visual states for payment processing (loading, success, failure)
  - Implement loading overlay to prevent interaction during payment processing
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 16.1 Write property test for payment state visual distinction
  - **Property 21: Payment state visual distinction**
  - **Validates: Requirements 11.3**

- [ ] 16.2 Write unit tests for cart and checkout
  - Test sticky order summary behavior
  - Test price breakdown display
  - Test loading overlay interaction prevention
  - _Requirements: 11.1, 11.2, 11.4_

- [ ] 17. Refactor Student Panel digital bill display
  - Render QR Code occupying at least 40% of viewport height
  - Display countdown timer large and centered (minimum 2rem font size)
  - Implement color progression: green (>5 min) → amber (≤5 min) → red (expired)
  - Disable all action buttons when bill expires
  - Display clear "Valid" or "Expired" status text
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 17.1 Write property test for expired bill interaction prevention
  - **Property 23: Expired bill interaction prevention**
  - **Validates: Requirements 12.6**

- [ ] 17.2 Write unit tests for digital bill display
  - Test QR code size relative to viewport
  - Test countdown timer styling
  - Test status text display
  - _Requirements: 12.1, 12.2, 12.7_

- [ ] 18. Enhance Student Panel order status and history
  - Implement timeline-style status visualization for active orders
  - Enable real-time order status updates without manual refresh
  - Display order history in card-based layout with most recent first
  - Add filter controls at top of order history page
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 18.1 Write property test for real-time status updates
  - **Property 24: Real-time status updates**
  - **Validates: Requirements 13.2**

- [ ] 18.2 Write unit tests for order status and history
  - Test timeline visualization rendering
  - Test order history layout and sorting
  - Test filter controls
  - _Requirements: 13.1, 13.3, 13.4_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Implement responsive optimizations across all panels
  - Test all panels at breakpoints: 320px, 640px, 768px, 1024px, 1280px, 1920px
  - Ensure grid columns stack vertically below 640px
  - Ensure 2-column layouts between 640px-1024px
  - Ensure multi-column layouts above 1024px
  - Verify no horizontal scrolling at any viewport width
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 20.1 Write property test for responsive grid column adaptation
  - **Property 25: Responsive grid column adaptation**
  - **Validates: Requirements 14.2, 14.3, 14.4**

- [ ] 20.2 Write integration tests for responsive behavior
  - Test layout changes at each breakpoint
  - Test mobile navigation functionality
  - Test touch interactions on mobile devices
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 21. Polish micro-interactions and transitions
  - Review all hover states for smooth transitions (150-300ms)
  - Add subtle animations for status changes
  - Implement loading skeletons for async content
  - Add focus indicators for keyboard navigation
  - _Requirements: 1.3_

- [ ] 21.1 Write accessibility tests
  - Test keyboard navigation across all panels
  - Test screen reader compatibility
  - Test focus management
  - Verify ARIA labels and roles
  - _Requirements: 1.4, 1.5_

- [ ] 22. Final checkpoint - Comprehensive testing
  - Run all unit tests and property tests
  - Perform manual testing across all panels
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test on mobile devices (iOS and Android)
  - Verify all requirements are met
  - Ensure all tests pass, ask the user if questions arise.
