// Export the main configuration service
export { ConfigurationService, configurationService } from './ConfigurationService';

// Export supporting classes
export { ConfigurationValidator } from './ConfigurationValidator';
export { ConfigurationCache } from './ConfigurationCache';
export { ConfigurationAuditLogger } from './ConfigurationAuditLogger';

// Export all types
export * from './types';

// Re-export commonly used types for convenience
export type {
  InstitutionConfig,
  InstitutionFeatures,
  InstitutionLimits,
  InstitutionSecurity,
  InstitutionBranding,
  GlobalConfig,
  ConfigurationAuditLog,
  ValidationResult,
  ConfigSchema
} from './types';