import api from './api';

export interface DashboardStats {
  activeCanteens: number;
  pendingApprovals: number;
  ordersToday: number;
  dailyRevenue: number;
}

export interface VendorWorkflowItem {
  id: string;
  vendorId: string;
  name: string;
  location: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  operatingHours?: {
    open: string;
    close: string;
  };
  status: 'pending' | 'active' | 'inactive';
}

export const institutionService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(institutionId: string): Promise<DashboardStats> {
    const response = await api.get(`/institutions/${institutionId}/dashboard-stats`);
    return response.data.data;
  },

  /**
   * Get vendor approval workflow
   */
  async getVendorWorkflow(institutionId: string): Promise<VendorWorkflowItem[]> {
    const response = await api.get(`/institutions/${institutionId}/vendor-workflow`);
    return response.data.data;
  },
};
