import { ConfigurationService } from './ConfigurationService';
import { ConfigurationValidator } from './ConfigurationValidator';
import { InstitutionFeatures, InstitutionLimits } from './types';

describe('ConfigurationService', () => {
  let configService: ConfigurationService;

  beforeEach(() => {
    configService = new ConfigurationService();
  });

  describe('Configuration Validation', () => {
    test('should validate valid feature configuration', () => {
      const validator = new ConfigurationValidator();
      const features: Partial<InstitutionFeatures> = {
        enable_ordering: true,
        allow_same_day_orders: true,
        max_items_per_order: 10,
        ordering_start_time: '08:00',
        ordering_end_time: '20:00'
      };

      const result = validator.validateFeatures(features);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid time format', () => {
      const validator = new ConfigurationValidator();
      const features: Partial<InstitutionFeatures> = {
        ordering_start_time: '25:00', // Invalid hour
        ordering_end_time: '20:60'    // Invalid minute
      };

      const result = validator.validateFeatures(features);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ordering_start_time must be in HH:MM format (24-hour)');
      expect(result.errors).toContain('ordering_end_time must be in HH:MM format (24-hour)');
    });

    test('should reject conflicting configurations', () => {
      const validator = new ConfigurationValidator();
      const features: Partial<InstitutionFeatures> = {
        vendor_must_accept_order: true,
        auto_accept_orders: true // Conflict
      };

      const result = validator.validateFeatures(features);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot have both vendor_must_accept_order and auto_accept_orders enabled');
    });

    test('should validate limits configuration', () => {
      const validator = new ConfigurationValidator();
      const limits: Partial<InstitutionLimits> = {
        max_users: 1000,
        max_vendors: 50,
        max_orders_per_day: 500,
        max_wallet_balance: 5000
      };

      const result = validator.validateLimits(limits);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject negative limits', () => {
      const validator = new ConfigurationValidator();
      const limits: Partial<InstitutionLimits> = {
        max_users: -1,
        max_vendors: -5
      };

      const result = validator.validateLimits(limits);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('max_users must be a non-negative number');
      expect(result.errors).toContain('max_vendors must be a non-negative number');
    });
  });

  describe('Configuration Inheritance', () => {
    test('should apply global overrides correctly', async () => {
      // This test would require database setup, so we'll mock it for now
      const mockGlobalConfig = {
        maintenance_mode: true,
        global_payments_enabled: false,
        global_real_time_enabled: true,
        new_institution_creation_enabled: true,
        maintenance_message: 'System maintenance',
        platform_announcement: '',
        support_contact_email: 'support@test.com',
        terms_of_service_url: '',
        privacy_policy_url: ''
      };

      const mockInstitutionConfig = {
        institutionId: 'test-institution',
        features: {
          enable_ordering: true,
          enable_wallet: true,
          enable_real_time_updates: true
        } as InstitutionFeatures,
        limits: {} as InstitutionLimits,
        security: {} as any,
        branding: {} as any,
        lastUpdated: new Date(),
        updatedBy: 'test'
      };

      // Mock the service methods
      jest.spyOn(configService, 'getGlobalConfig').mockResolvedValue(mockGlobalConfig);
      jest.spyOn(configService, 'getInstitutionConfig').mockResolvedValue(mockInstitutionConfig);

      const effectiveConfig = await configService.getEffectiveConfig('test-institution');

      // In maintenance mode, ordering should be disabled
      expect(effectiveConfig.features.enable_ordering).toBe(false);
      
      // With global payments disabled, wallet should be disabled
      expect(effectiveConfig.features.enable_wallet).toBe(false);
      
      // Real-time should remain enabled as global setting allows it
      expect(effectiveConfig.features.enable_real_time_updates).toBe(true);
    });
  });

  describe('Feature Status Checking', () => {
    test('should correctly identify enabled features', async () => {
      const mockConfig = {
        institutionId: 'test-institution',
        features: {
          enable_ordering: true,
          enable_wallet: false
        } as InstitutionFeatures,
        limits: {} as InstitutionLimits,
        security: {} as any,
        branding: {} as any,
        lastUpdated: new Date(),
        updatedBy: 'test'
      };

      jest.spyOn(configService, 'getEffectiveConfig').mockResolvedValue(mockConfig);

      const orderingEnabled = await configService.isFeatureEnabled('test-institution', 'enable_ordering');
      const walletEnabled = await configService.isFeatureEnabled('test-institution', 'enable_wallet');

      expect(orderingEnabled).toBe(true);
      expect(walletEnabled).toBe(false);
    });
  });
});