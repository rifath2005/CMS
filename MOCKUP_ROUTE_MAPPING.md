# Stitch Mockup to Route Mapping

## Overview
This document maps the 8 Stitch-designed mockup pages to the React Application routes and components.
We are migrating from the old `/super-admin/` prefix to `/main-admin/` to align with the new design.

## Route Mapping

| Stitch Page Name | Route Path | Component Name | Status |
|------------------|------------|----------------|--------|
| **Dashboard** | `/main-admin/dashboard` | `MainAdminDashboard` (Refactor of `Dashboard.tsx`) | 🔄 Rename & Update |
| **Organizations** | `/main-admin/organizations` | `OrganizationsList` (Refactor of `Institutions.tsx`) | 🔄 Rename & Update |
| **Org Configuration** | `/main-admin/organizations/:id/configure` | `OrgConfiguration` (Refactor of `InstitutionConfig.tsx`) | 🔄 Update |
| **Org Admins** | `/main-admin/org-admins` | `OrgAdminsList` (New/Refactor of `InstitutionAdmins.tsx`) | 🔄 Update |
| **Vendors** | `/main-admin/vendors` | `GlobalVendorsList` (Refactor of `Vendors.tsx`) | 🔄 Update |
| **Users** | `/main-admin/users` | `GlobalUsersList` (Refactor of `Users.tsx`) | 🔄 Rename & Update |
| **Audit Logs** | `/main-admin/audit-logs` | `AuditLogs` (Refactor of `AuditLogs.tsx`) | 🔄 Rename & Update |
| **System Settings** | `/main-admin/system-settings` | `SystemSettings` (Refactor of `Settings.tsx`) | 🔄 Rename & Update |

## Sidebar Structure (Navigation)
The Sidebar will be updated to match the Stitch design (exact order):

1.  **Dashboard** (Icon: LayoutDashboard)
2.  **Organizations** (Icon: Building2)
    *   *Includes hidden child route: Configuration*
3.  **Org Admins** (Icon: ShieldCheck)
4.  **Vendors** (Icon: Store)
5.  **Users** (Icon: Users)
6.  **Audit Logs** (Icon: FileText)
7.  **System Settings** (Icon: Settings)

## Implementation Plan
1.  **Rename Routes**: Update `App.tsx` and `SuperAdminLayout` (to be renamed `MainAdminLayout`).
2.  **Refactor Layout**: Update sidebar items and aesthetics.
3.  **Page Implementation**: Iterate through each page to match the "Stitch" aesthetic (Premium, Glassmorphism, etc).
