# Implementation Plan - Streamlined for Fast Execution

## Completed Tasks

- [x] 1. Set up design system foundation
  - Create Tailwind configuration extensions with 8px grid spacing system, semantic colors, and transition durations
  - Create shared components directory structure (src/components/shared/)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create shared component library
  - Implement KPICard component with hover elevation and responsive sizing
  - Implement StatusChip component with semantic color mapping and size variants
  - Implement DataTable component with sticky headers, zebra striping, and hover actions
  - Implement StepDrawer component with multi-step navigation and progress indicator
  - Implement CountdownTimer component with color progression logic
  - _Requirements: 2.3, 2.4, 3.3, 3.4, 4.6, 12.3, 12.4, 12.5_

- [x] 3. Refactor Super Admin Panel dashboard
  - Update PlatformStats page to use 12-column responsive grid layout
  - Replace existing stat cards with new KPICard components
  - Add trend indicators to KPI cards where applicable
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Refactor Super Admin institution management
  - Update Institutions page to use DataTable component with sticky headers
  - Implement status chips for institution status display
  - Add hover-revealed action buttons to table rows
  - Convert CreateInstitutionModal to StepDrawer
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

## Remaining Core Tasks

- [ ] 5. Refactor Institution Admin Panel dashboard





  - Update dashboard to display overview cards for Active Canteens, Pending Vendor Approvals, Orders Today, and Low-stock Alerts
  - Organize vendor display into three status-based sections: Pending Approval, Active Vendors, Deactivated Vendors
  - Implement vendor cards with Vendor ID, Canteen Name, Approval State, and Primary Action Button
  - Ensure approval actions are reachable within 2 clicks
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Enhance Institution Admin vendor management
  - Implement instant visual feedback for vendor status changes without page reload
  - Apply zebra striping to all data tables
  - Add inline action buttons (Approve, Deactivate) to table rows
  - _Requirements: 4.5, 4.6, 5.4_

- [ ] 7. Refactor Institution Admin canteen registration
  - Organize canteen registration form into three sections: Identity, Location, Operating Hours
  - Implement visual highlighting for auto-generated Vendor ID (read-only with border/background)
  - Apply sticky headers to all tables in Institution Admin Panel
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Refactor Vendor Panel active orders view
  - Implement split layout with Active Orders list (40% left) and Order Details (60% right)
  - Sort active orders with oldest first
  - Update order cards to prominently show User Name, Order Time, and Status Chip
  - Add subtle fade/slide animation for status transitions
  - Ensure all interactive elements meet 44px minimum touch target size
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Implement Vendor Panel combined item list
  - Create dedicated screen or pinned section for combined item list
  - Render item quantities with visual dominance (larger font size and weight)
  - Group items by category where categories exist
  - Add auto-refresh pulse/dot indicator
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10. Refactor Vendor Panel QR scanner interface
  - Implement fullscreen camera-first QR scanner UI
  - Add single primary "Scan" action button
  - Implement green confirmation screen on success with 2-second auto-return
  - Display clear error messages with failure reasons (expired, invalid) on failure
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Enhance Vendor Panel inventory management
  - Implement inline stock editing capability
  - Add visual emphasis for low-stock warnings (color and icon)
  - Clearly disable unavailable items with reduced opacity
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 12. Refactor Student Panel product browsing
  - Update Products page to use card-based layout optimized for mobile
  - Render out-of-stock products as disabled with greyed appearance and reduced opacity
  - Implement category filters as horizontal scrollable chips
  - Apply consistent 8px grid spacing to product cards
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Refactor Student Panel cart and checkout
  - Implement sticky order summary that remains visible during scroll
  - Display clear price breakdown (subtotal, taxes, total)
  - Add distinct visual states for payment processing (loading, success, failure)
  - Implement loading overlay to prevent interaction during payment processing
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 14. Refactor Student Panel digital bill display
  - Render QR Code occupying at least 40% of viewport height
  - Display countdown timer large and centered (minimum 2rem font size)
  - Implement color progression: green (>5 min) → amber (≤5 min) → red (expired)
  - Disable all action buttons when bill expires
  - Display clear "Valid" or "Expired" status text
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 15. Enhance Student Panel order status and history
  - Implement timeline-style status visualization for active orders
  - Enable real-time order status updates without manual refresh
  - Display order history in card-based layout with most recent first
  - Add filter controls at top of order history page
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 16. Implement responsive optimizations across all panels
  - Test all panels at breakpoints: 320px, 640px, 768px, 1024px, 1280px, 1920px
  - Ensure grid columns stack vertically below 640px
  - Ensure 2-column layouts between 640px-1024px
  - Ensure multi-column layouts above 1024px
  - Verify no horizontal scrolling at any viewport width
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 17. Polish micro-interactions and transitions
  - Review all hover states for smooth transitions (150-300ms)
  - Add subtle animations for status changes
  - Implement loading skeletons for async content
  - Add focus indicators for keyboard navigation
  - _Requirements: 1.3_

## Notes
- All property-based tests and unit tests have been removed to focus on core implementation
- Testing can be added later if needed
- Focus is on delivering working UI/UX improvements quickly
