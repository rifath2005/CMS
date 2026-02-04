/**
 * Feature Flag Middleware
 * Enforces institution-level feature flags on API routes
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { InstitutionFeatures, FeatureKey } from '../types/institutionConfig';

export interface FeatureFlagRequest extends Request {
  institutionId?: string;
  institutionFeatures?: InstitutionFeatures;
}

/**
 * Middleware factory to check if a feature is enabled for an institution
 * @param pool - Database connection pool
 * @param featureKey - The feature flag to check
 * @param errorMessage - Optional custom error message
 */
export const requireFeature = (
  pool: Pool,
  featureKey: FeatureKey,
  errorMessage?: string
) => {
  return async (req: FeatureFlagRequest, res: Response, next: NextFunction) => {
    try {
      // Get institution ID from JWT (set by auth middleware)
      const institutionId = req.institutionId || req.user?.institutionId;

      if (!institutionId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Institution ID not found'
        });
      }

      // Fetch institution features from database
      const result = await pool.query(
        'SELECT features FROM institutions WHERE id = $1 AND status = $2',
        [institutionId, 'active']
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Institution not found or inactive'
        });
      }

      const features: InstitutionFeatures = result.rows[0].features;
      
      // Attach features to request for later use
      req.institutionFeatures = features;

      // Check if feature is enabled
      if (!features[featureKey]) {
        return res.status(403).json({
          error: 'Feature Disabled',
          message: errorMessage || `The feature '${featureKey}' is not enabled for your institution`,
          featureKey
        });
      }

      next();
    } catch (error) {
      console.error('Feature flag check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check feature flag'
      });
    }
  };
};

/**
 * Middleware to load institution features into request
 * Does not enforce, just loads for conditional logic
 */
export const loadInstitutionFeatures = (pool: Pool) => {
  return async (req: FeatureFlagRequest, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.institutionId || req.user?.institutionId;

      if (!institutionId) {
        return next();
      }

      const result = await pool.query(
        'SELECT features, limits, branding, security, status, plan FROM institutions WHERE id = $1',
        [institutionId]
      );

      if (result.rows.length > 0) {
        req.institutionFeatures = result.rows[0].features;
        req.institutionLimits = result.rows[0].limits;
        req.institutionBranding = result.rows[0].branding;
        req.institutionSecurity = result.rows[0].security;
        req.institutionStatus = result.rows[0].status;
        req.institutionPlan = result.rows[0].plan;
      }

      next();
    } catch (error) {
      console.error('Load institution features error:', error);
      next();
    }
  };
};

/**
 * Check multiple features (AND logic - all must be enabled)
 */
export const requireAllFeatures = (
  pool: Pool,
  featureKeys: FeatureKey[],
  errorMessage?: string
) => {
  return async (req: FeatureFlagRequest, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.institutionId || req.user?.institutionId;

      if (!institutionId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Institution ID not found'
        });
      }

      const result = await pool.query(
        'SELECT features FROM institutions WHERE id = $1 AND status = $2',
        [institutionId, 'active']
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Institution not found or inactive'
        });
      }

      const features: InstitutionFeatures = result.rows[0].features;
      req.institutionFeatures = features;

      // Check all features
      const disabledFeatures = featureKeys.filter(key => !features[key]);

      if (disabledFeatures.length > 0) {
        return res.status(403).json({
          error: 'Features Disabled',
          message: errorMessage || `Required features are not enabled: ${disabledFeatures.join(', ')}`,
          disabledFeatures
        });
      }

      next();
    } catch (error) {
      console.error('Feature flags check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check feature flags'
      });
    }
  };
};

/**
 * Check if any of the features is enabled (OR logic)
 */
export const requireAnyFeature = (
  pool: Pool,
  featureKeys: FeatureKey[],
  errorMessage?: string
) => {
  return async (req: FeatureFlagRequest, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.institutionId || req.user?.institutionId;

      if (!institutionId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Institution ID not found'
        });
      }

      const result = await pool.query(
        'SELECT features FROM institutions WHERE id = $1 AND status = $2',
        [institutionId, 'active']
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Institution not found or inactive'
        });
      }

      const features: InstitutionFeatures = result.rows[0].features;
      req.institutionFeatures = features;

      // Check if at least one feature is enabled
      const hasAnyEnabled = featureKeys.some(key => features[key]);

      if (!hasAnyEnabled) {
        return res.status(403).json({
          error: 'Features Disabled',
          message: errorMessage || `At least one of these features must be enabled: ${featureKeys.join(', ')}`,
          requiredFeatures: featureKeys
        });
      }

      next();
    } catch (error) {
      console.error('Feature flags check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check feature flags'
      });
    }
  };
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      institutionId?: string;
      institutionFeatures?: InstitutionFeatures;
      institutionLimits?: any;
      institutionBranding?: any;
      institutionSecurity?: any;
      institutionStatus?: string;
      institutionPlan?: string;
    }
  }
}
