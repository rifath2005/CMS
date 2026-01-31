export enum UserRole {
  MAIN_ADMIN = 'MAIN_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  VENDOR = 'VENDOR',
  USER = 'USER'
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  institutionId?: string
  createdAt: string
}

export interface Institution {
  id: string
  name: string
  emailDomain: string
  contactEmail?: string
  contactPhone?: string
  createdAt: string
}

export interface Canteen {
  id: string
  institutionId: string
  vendorId: string
  name: string
  location: string
  operatingHours?: {
    open: string
    close: string
  }
  isActive: boolean
  createdAt: string
}

export interface InstitutionStats {
  totalUsers: number
  totalCanteens: number
  totalOrders: number
  totalRevenue: number
}

export interface PlatformStats {
  totalInstitutions: number
  totalUsers: number
  totalCanteens: number
  totalOrders: number
  totalRevenue: number
}
