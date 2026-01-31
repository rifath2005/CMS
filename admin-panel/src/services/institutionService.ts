import api from './api'
import { Institution, InstitutionStats, PlatformStats } from '../types'

export interface CreateInstitutionData {
  name: string
  emailDomain: string
  contactEmail?: string
  contactPhone?: string
}

export interface AssignAdminData {
  email: string
  password: string
  name: string
  institutionId: string
}

export const institutionService = {
  // Main Admin endpoints
  createInstitution: async (data: CreateInstitutionData): Promise<Institution> => {
    const response = await api.post('/institutions', data)
    return response.data
  },

  getAllInstitutions: async (): Promise<Institution[]> => {
    const response = await api.get('/institutions')
    return response.data
  },

  getInstitutionById: async (id: string): Promise<Institution> => {
    const response = await api.get(`/institutions/${id}`)
    return response.data
  },

  assignInstitutionAdmin: async (data: AssignAdminData): Promise<void> => {
    await api.post('/institutions/assign-admin', data)
  },

  getPlatformStats: async (): Promise<PlatformStats> => {
    const response = await api.get('/institutions/platform-stats')
    return response.data
  },

  getInstitutionStats: async (institutionId: string): Promise<InstitutionStats> => {
    const response = await api.get(`/institutions/${institutionId}/stats`)
    return response.data
  },
}
