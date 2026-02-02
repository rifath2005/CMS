import api from './api';

export interface Canteen {
  id: string;
  institutionId: string;
  vendorId: string;
  name: string;
  location: string;
  operatingHours?: {
    open: string;
    close: string;
  };
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

export const canteenService = {
  /**
   * Get canteens by institution
   */
  async getCanteensByInstitution(institutionId: string): Promise<Canteen[]> {
    const response = await api.get(`/institutions/${institutionId}/canteens`);
    return response.data.data;
  },

  /**
   * Create new canteen/vendor
   */
  async createCanteen(institutionId: string, data: {
    name: string;
    location: string;
    contactPhone: string;
    ownerName: string;
    ownerEmail: string;
    operatingHours?: {
      open: string;
      close: string;
    };
  }): Promise<Canteen> {
    const response = await api.post(`/institutions/${institutionId}/canteens`, data);
    return response.data.data;
  },

  /**
   * Update canteen/vendor
   */
  async updateCanteen(canteenId: string, data: {
    name: string;
    location: string;
    operatingHours?: {
      open: string;
      close: string;
    };
  }): Promise<Canteen> {
    const response = await api.put(`/canteens/${canteenId}`, data);
    return response.data.data;
  },

  /**
   * Approve vendor
   */
  async approveVendor(vendorId: string): Promise<void> {
    // Find canteen by vendor_id and approve it
    const response = await api.get(`/canteens/vendor/${vendorId}`);
    const canteen = response.data.data;
    await api.post(`/canteens/${canteen.id}/approve`);
  },

  /**
   * Deactivate vendor
   */
  async deactivateVendor(vendorId: string): Promise<void> {
    const response = await api.get(`/canteens/vendor/${vendorId}`);
    const canteen = response.data.data;
    await api.post(`/canteens/${canteen.id}/deactivate`);
  },

  /**
   * Activate vendor
   */
  async activateVendor(vendorId: string): Promise<void> {
    const response = await api.get(`/canteens/vendor/${vendorId}`);
    const canteen = response.data.data;
    await api.post(`/canteens/${canteen.id}/activate`);
  },
};
