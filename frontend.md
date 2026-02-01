You are improving the UI/UX of an existing Canteen Management System.
DO NOT change backend APIs, database schemas, business logic, or role permissions.

Your task is ONLY:
- UI structure
- UX flow
- Layout hierarchy
- Component styling
- Responsiveness
- Micro-interactions

Constraints:
- Use existing routes, API responses, and role-based access
- Reuse existing components where possible
- Prefer small, incremental refactors
- No visual overengineering

Global UI Rules:
- Mobile-first, responsive
- Consistent spacing system (8px grid)
- Clear information hierarchy
- Semantic colors for states (success, warning, error)
- Smooth but subtle transitions (no heavy animations)
- Accessibility-first (contrast, font size, tap targets)

Always explain:
1. What UI changes you are making
2. Why the UX is improved
3. What components were reused or modified


PANEL 1: SUPER ADMIN PANEL (PLATFORM LEVEL)
Refactor the Super Admin panel UI for clarity and executive-level overview.

Primary goals:
- High-level visibility
- Minimal interaction friction
- Data-first layout

UI Tasks:
1. Redesign the dashboard into a 12-column grid.
2. Top section: KPI cards
   - Total Institutions
   - Active Institutions
   - Active Vendors
   - Total Orders (Today)
3. KPI cards must:
   - Use large numeric emphasis
   - Subtle hover elevation
   - Secondary text for trends

4. Institution Management Table:
   - Sticky table header
   - Columns: Institution Name | Domain | Status | Created Date | Actions
   - Status displayed as color-coded chips
   - Row actions hidden until hover

5. Institution Creation:
   - Convert modal form into step-based drawer
   - Step 1: Basic Info
   - Step 2: Contact & Domain
   - Step 3: Admin Assignment

6. Analytics:
   - Use clean line/bar charts
   - No decorative charts
   - Emphasize readability over style

UX Improvements:
- Reduce scroll depth
- Make platform health visible within 5 seconds
- No nested modals

Do not add new features.

PANEL 2: INSTITUTION ADMIN PANEL (CAMPUS CONTROL)
Improve the Institution Admin panel UI for operational efficiency.

Primary goals:
- Fast vendor management
- Clear approval states
- Low cognitive load

UI Tasks:
1. Dashboard Overview:
   - Active Canteens
   - Pending Vendor Approvals
   - Orders Today
   - Low-stock alerts (if available)

2. Vendor Approval Flow:
   - Replace generic tables with status-based sections:
     - Pending Approval
     - Active Vendors
     - Deactivated Vendors
   - Each vendor card must show:
     - Vendor ID
     - Canteen name
     - Approval state
     - Primary action button

3. Canteen Registration:
   - Convert form into structured sections:
     - Identity
     - Location
     - Operating Hours
   - Auto-generated Vendor ID must be:
     - Read-only
     - Visually highlighted

4. Tables:
   - Zebra striping
   - Sticky headers
   - Inline actions (Approve / Deactivate)

UX Improvements:
- Approval action must be reachable in ≤2 clicks
- Status changes must show instant visual feedback
- Avoid full page reloads

Preserve all existing permissions and flows.

PANEL 3: VENDOR PANEL (MOST CRITICAL UX)
Refactor the Vendor panel for speed, clarity, and real-time operations.

Primary goals:
- Zero ambiguity
- Fast scanning
- Minimal interaction during rush hours

UI Tasks:
1. Active Orders View:
   - Split layout:
     - Left: Active Orders list (oldest first)
     - Right: Order Details
   - Order cards show:
     - User name
     - Order time
     - Status chip
   - Status transitions animated subtly

2. Combined Item List:
   - Dedicated screen or pinned section
   - Item quantity must be visually dominant
   - Group items by category if available
   - Auto-refresh indicator (small pulse or dot)

3. QR Scanner:
   - Fullscreen, camera-first UI
   - Single primary action: “Scan”
   - On success:
     - Green confirmation screen
     - Auto-return to orders
   - On failure:
     - Clear error reason (expired / invalid)

4. Inventory Management:
   - Inline stock editing
   - Low-stock warnings visually emphasized
   - Disable unavailable items clearly

UX Improvements:
- Touch targets ≥44px
- No nested modals
- One primary action per screen
- Visual priority: quantity > name > metadata

Do NOT add extra confirmation steps for delivery.

PANEL 4: STUDENT PANEL (USER TRUST & SPEED)

Refactor the Student panel UI with a mobile-first, trust-focused design.

Primary goals:
- Fast ordering
- Absolute clarity during pickup
- Stress-free bill visibility

UI Tasks:
1. Home / Menu:
   - Card-based product layout
   - Clear out-of-stock states (disabled, greyed)
   - Category filters as horizontal chips

2. Cart & Checkout:
   - Sticky order summary
   - Clear price breakdown
   - Payment state feedback (loading, success, failure)

3. Digital Bill Screen (Highest Priority):
   - QR Code occupies at least 40% viewport
   - Countdown timer large and centered
   - Color progression:
     - Green → Amber (last 5 min) → Red (expired)
   - Disable all actions when expired
   - Clear status text (Valid / Expired)

4. Active Order Status:
   - Timeline-style status display
   - Real-time updates without refresh

5. Order History:
   - Card-based layout
   - Filters at top
   - Most recent first

UX Improvements:
- Reduce anxiety during pickup
- Make bill validity unmistakable
- Zero confusion about order state

HOW TO USE YOUR STITCH SAMPLES (IMPORTANT)
samples exsits in "cms-ui" folder

When a Stitch sample exists:
- Use it as visual inspiration ONLY
- Do not blindly replicate layout
- Adapt spacing, hierarchy, and components to CMS context
- Ensure role-based constraints are respected