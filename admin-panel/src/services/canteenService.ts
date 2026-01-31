import api from './api'
import { Canteen } from '../types'

export interface CreateCanteenData {
  institutionId: string
  name: string
  location: string
  operatingHours?: {
    open: string
    close: string
  }
}

export interface VendorApprovalData {
  vendorId: string
  approved: boolean
}

export const canteenService = {
  // Institution Admin endpoints
  createCanteen: async (data: CreateCanteenData): Promise<Canteen> => {
    const response = await api.post('/canteens', data)
    return response.data
  },

  getCanteensByInstitution: async (institutionId: string): Promise<Canteen[]> => {
    const response = await api.get(`/canteens/institution/${institutionId}`)
    return response.data
  },

  getCanteenById: async (id: string): Promise<Canteen> => {
    const response = await api.get(`/canteens/${id}`)
    return response.data
  },

  approveVendor: async (vendorId: string): Promise<void> => {
    await api.post(`/canteens/${vendorId}/approve`)
  },

  deactivateVendor: async (vendorId: string): Promise<void> => {
    await api.post(`/canteens/${vendorId}/deactivate`)
  },

  activateVendor: async (vendorId: string): Promise<void> => {
    await api.post(`/canteens/${vendorId}/activate`)
  },
}
