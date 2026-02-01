# Requirements Document

## Introduction

This document outlines the requirements for enhancing the UI/UX of the existing Canteen Management System (CMS). The enhancement focuses on improving visual design, user experience, responsiveness, and interaction patterns across four distinct user panels: Super Admin Panel, Institution Admin Panel, Vendor Panel, and Student Panel. The improvements are strictly limited to frontend presentation layer changes without modifying backend APIs, database schemas, business logic, or role-based permissions.

## Glossary

- **CMS**: Canteen Management System - the complete platform for managing institutional canteen operations
- **Super Admin Panel**: Platform-level administrative interface for managing multiple institutions
- **Institution Admin Panel**: Campus-level administrative interface for managing vendors and canteens within a single institution
- **Vendor Panel**: Operational interface for canteen vendors to manage orders, inventory, and QR verification
- **Student Panel**: User-facing interface for students to browse products, place orders, and view digital bills
- **KPI Card**: Key Performance Indicator card - a visual component displaying a single metric with emphasis
- **Digital Bill**: Electronic receipt with QR code for order verification and pickup
- **QR Code**: Quick Response code used for order verification during pickup
- **Status Chip**: Visual indicator displaying the current state of an entity (order, vendor, institution)
- **Sticky Header**: Table or section header that remains visible while scrolling
- **8px Grid System**: Consistent spacing system where all margins and paddings are multiples of 8 pixels
- **Touch Target**: Interactive element sized for comfortable touch interaction (minimum 44px)
- **Drawer**: Side panel that slides in from the edge of the screen for forms or details
- **Zebra Striping**: Alternating row colors in tables for improved readability
- **Viewport**: The visible area of a web page on a device screen

## Requirements

### Requirement 1: Global Design System

**User Story:** As a user of any panel, I want a consistent and accessible visual design system, so that the interface feels cohesive and is easy to use across all devices.

#### Acceptance Criteria

1. THE CMS SHALL implement an 8px grid spacing system for all margins and paddings
2. THE CMS SHALL use semantic color coding for state indicators (success as green, warning as yellow, error as red)
3. THE CMS SHALL apply smooth transitions with duration between 150ms and 300ms for all interactive state changes
4. THE CMS SHALL ensure all text meets WCAG AA contrast ratio requirements (minimum 4.5:1 for normal text)
5. THE CMS SHALL size all interactive touch targets to a minimum of 44px by 44px
6. THE CMS SHALL implement mobile-first responsive layouts that adapt to viewport widths from 320px to 1920px
7. THE CMS SHALL use consistent typography hierarchy with font sizes scaling proportionally across breakpoints

### Requirement 2: Super Admin Panel Dashboard Enhancement

**User Story:** As a Super Admin, I want a clear executive-level dashboard with prominent KPIs, so that I can assess platform health within 5 seconds of viewing.

#### Acceptance Criteria

1. WHEN the Super Admin views the dashboard THEN THE CMS SHALL display KPI cards in a 12-column responsive grid layout
2. THE CMS SHALL display four primary KPI cards showing Total Institutions, Active Institutions, Active Vendors, and Total Orders Today
3. WHEN displaying KPI cards THEN THE CMS SHALL emphasize numeric values with font size at least 2rem and secondary trend text at 0.875rem
4. WHEN a user hovers over a KPI card THEN THE CMS SHALL apply subtle elevation increase with box-shadow transition
5. THE CMS SHALL limit dashboard scroll depth to a maximum of 2 viewport heights for primary information
6. THE CMS SHALL display analytics using clean line or bar charts without decorative elements

### Requirement 3: Super Admin Institution Management

**User Story:** As a Super Admin, I want an efficient institution management interface with clear status indicators, so that I can quickly manage multiple institutions without confusion.

#### Acceptance Criteria

1. THE CMS SHALL display institution data in a table with sticky header that remains visible during vertical scroll
2. THE CMS SHALL include columns for Institution Name, Domain, Status, Created Date, and Actions in the institution table
3. WHEN displaying institution status THEN THE CMS SHALL render color-coded chips (active as green, inactive as gray, pending as yellow)
4. WHEN a user hovers over a table row THEN THE CMS SHALL reveal action buttons with fade-in transition
5. WHEN creating a new institution THEN THE CMS SHALL present a step-based drawer interface with three steps: Basic Info, Contact and Domain, and Admin Assignment
6. THE CMS SHALL prevent nested modal dialogs throughout the Super Admin Panel

### Requirement 4: Institution Admin Dashboard Enhancement

**User Story:** As an Institution Admin, I want an operational dashboard with clear approval states, so that I can manage vendors efficiently with minimal cognitive load.

#### Acceptance Criteria

1. WHEN the Institution Admin views the dashboard THEN THE CMS SHALL display overview cards for Active Canteens, Pending Vendor Approvals, Orders Today, and Low-stock Alerts
2. THE CMS SHALL organize vendors into three status-based sections: Pending Approval, Active Vendors, and Deactivated Vendors
3. WHEN displaying vendor cards THEN THE CMS SHALL show Vendor ID, Canteen Name, Approval State, and Primary Action Button
4. THE CMS SHALL make vendor approval actions reachable within 2 clicks from the dashboard
5. WHEN a vendor status changes THEN THE CMS SHALL provide instant visual feedback without full page reload
6. THE CMS SHALL apply zebra striping to all data tables with alternating row background colors

### Requirement 5: Institution Admin Canteen Registration

**User Story:** As an Institution Admin, I want a structured canteen registration form with clear sections, so that I can efficiently register new canteens without errors.

#### Acceptance Criteria

1. WHEN registering a canteen THEN THE CMS SHALL organize the form into three sections: Identity, Location, and Operating Hours
2. WHEN displaying auto-generated Vendor ID THEN THE CMS SHALL render it as read-only with visual highlighting using border or background color
3. THE CMS SHALL apply sticky headers to all tables in the Institution Admin Panel
4. THE CMS SHALL provide inline action buttons (Approve, Deactivate) within table rows

### Requirement 6: Vendor Panel Active Orders Interface

**User Story:** As a Vendor, I want a fast-scanning orders interface with zero ambiguity, so that I can process orders quickly during rush hours without mistakes.

#### Acceptance Criteria

1. WHEN viewing active orders THEN THE CMS SHALL display a split layout with Active Orders list on the left and Order Details on the right
2. THE CMS SHALL sort active orders with oldest orders first in the list
3. WHEN displaying order cards THEN THE CMS SHALL show User Name, Order Time, and Status Chip prominently
4. WHEN order status transitions occur THEN THE CMS SHALL animate the change with subtle fade or slide transition
5. THE CMS SHALL ensure all interactive elements in the Vendor Panel have touch targets of at least 44px by 44px
6. THE CMS SHALL limit each screen to one primary action to reduce decision fatigue

### Requirement 7: Vendor Panel Combined Item List

**User Story:** As a Vendor, I want a dedicated combined item list view with dominant quantity display, so that I can prepare multiple orders efficiently.

#### Acceptance Criteria

1. THE CMS SHALL provide a dedicated screen or pinned section for the combined item list
2. WHEN displaying combined items THEN THE CMS SHALL render item quantities with visual dominance using larger font size and weight
3. WHERE items have categories THEN THE CMS SHALL group items by category in the combined list
4. WHEN the combined item list auto-refreshes THEN THE CMS SHALL display a small pulse or dot indicator

### Requirement 8: Vendor Panel QR Scanner Interface

**User Story:** As a Vendor, I want a fullscreen camera-first QR scanner, so that I can verify orders quickly with clear success or failure feedback.

#### Acceptance Criteria

1. WHEN accessing the QR scanner THEN THE CMS SHALL display a fullscreen camera-first interface
2. THE CMS SHALL provide a single primary action button labeled "Scan" in the QR scanner interface
3. WHEN QR scan succeeds THEN THE CMS SHALL display a green confirmation screen and automatically return to orders within 2 seconds
4. WHEN QR scan fails THEN THE CMS SHALL display a clear error message indicating the failure reason (expired or invalid)
5. THE CMS SHALL prevent nested modal dialogs in the Vendor Panel

### Requirement 9: Vendor Panel Inventory Management

**User Story:** As a Vendor, I want inline stock editing with clear low-stock warnings, so that I can manage inventory efficiently without navigation overhead.

#### Acceptance Criteria

1. THE CMS SHALL provide inline editing capability for stock quantities in the inventory list
2. WHEN stock quantity falls below threshold THEN THE CMS SHALL visually emphasize low-stock warnings with color and icon
3. WHEN items are unavailable THEN THE CMS SHALL clearly disable them with reduced opacity and disabled state styling

### Requirement 10: Student Panel Menu and Product Browsing

**User Story:** As a Student, I want a mobile-first product browsing experience with clear availability states, so that I can order quickly without confusion.

#### Acceptance Criteria

1. THE CMS SHALL display products in a card-based layout optimized for mobile viewports
2. WHEN products are out of stock THEN THE CMS SHALL render them as disabled with greyed appearance and reduced opacity
3. THE CMS SHALL provide category filters as horizontal scrollable chips above the product grid
4. THE CMS SHALL display product cards with consistent spacing using the 8px grid system

### Requirement 11: Student Panel Cart and Checkout

**User Story:** As a Student, I want a clear checkout process with sticky order summary, so that I understand costs and payment status at all times.

#### Acceptance Criteria

1. WHEN viewing cart or checkout THEN THE CMS SHALL display a sticky order summary that remains visible during scroll
2. THE CMS SHALL provide a clear price breakdown showing subtotal, taxes, and total
3. WHEN payment processing occurs THEN THE CMS SHALL display distinct visual states for loading, success, and failure
4. THE CMS SHALL prevent user interaction during payment processing with loading overlay

### Requirement 12: Student Panel Digital Bill Display

**User Story:** As a Student, I want an unmistakable digital bill screen with prominent QR code and countdown timer, so that I can complete pickup without stress or confusion.

#### Acceptance Criteria

1. WHEN displaying the digital bill THEN THE CMS SHALL render the QR Code occupying at least 40 percent of the viewport height
2. THE CMS SHALL display the countdown timer large and centered with font size at least 2rem
3. WHEN countdown timer has more than 5 minutes remaining THEN THE CMS SHALL display green color
4. WHEN countdown timer has 5 minutes or less remaining THEN THE CMS SHALL transition to amber color
5. WHEN countdown timer expires THEN THE CMS SHALL transition to red color and display "Expired" status
6. WHEN the bill expires THEN THE CMS SHALL disable all action buttons and prevent further interactions
7. THE CMS SHALL display clear status text indicating "Valid" or "Expired" state

### Requirement 13: Student Panel Order Status and History

**User Story:** As a Student, I want clear order status visualization and accessible order history, so that I can track my orders without anxiety.

#### Acceptance Criteria

1. WHEN viewing active order status THEN THE CMS SHALL display a timeline-style status visualization
2. THE CMS SHALL update order status in real-time without requiring manual page refresh
3. WHEN viewing order history THEN THE CMS SHALL display orders in card-based layout with most recent first
4. THE CMS SHALL provide filter controls at the top of the order history page

### Requirement 14: Responsive Layout Adaptation

**User Story:** As a user on any device, I want the interface to adapt seamlessly to my screen size, so that I can use the CMS effectively on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE CMS SHALL implement breakpoints at 640px (mobile), 768px (tablet), 1024px (desktop), and 1280px (large desktop)
2. WHEN viewport width is below 640px THEN THE CMS SHALL stack all grid columns vertically
3. WHEN viewport width is between 640px and 1024px THEN THE CMS SHALL display grids in 2-column layout where applicable
4. WHEN viewport width exceeds 1024px THEN THE CMS SHALL display full multi-column grid layouts
5. THE CMS SHALL ensure all text remains readable without horizontal scrolling at any viewport width

### Requirement 15: Component Reusability and Consistency

**User Story:** As a developer maintaining the CMS, I want reusable UI components with consistent behavior, so that the codebase remains maintainable and changes propagate consistently.

#### Acceptance Criteria

1. THE CMS SHALL reuse existing LoadingSpinner, ErrorAlert, and Layout components across all panels
2. THE CMS SHALL create shared components for Status Chips, KPI Cards, and Action Buttons
3. WHEN modifying a shared component THEN THE CMS SHALL apply changes consistently across all panels that use it
4. THE CMS SHALL maintain component prop interfaces without breaking changes during UI enhancement
