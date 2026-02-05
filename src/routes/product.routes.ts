import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { ProductService } from '../services/product/ProductService';
import { authenticate } from '../middleware/auth.middleware';
import { requireVendor } from '../middleware/rbac.middleware';
import { ValidationError, NotFoundError } from '../utils/errors';

export const createProductRouter = (pool: Pool): Router => {
  const router = Router();
  const productService = new ProductService(pool);

  // POST /api/v1/products - Create product (Vendor only)
  router.post('/', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      console.log('=== CREATE PRODUCT REQUEST ===');
      console.log('Request body:', req.body);
      console.log('User from auth:', (req as any).user);
      
      const { name, description, price, category, imageUrl, stockQuantity } = req.body;
      
      // Get vendorId by looking up the canteen linked to this user
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        console.log('Validation failed - no user ID in token');
        throw new ValidationError('User ID not found in token');
      }

      // Query canteen to get vendor_id for this user
      const canteenResult = await pool.query(
        'SELECT vendor_id FROM canteens WHERE user_id = $1',
        [userId]
      );

      if (canteenResult.rows.length === 0) {
        console.log('Validation failed - no canteen found for user');
        throw new ValidationError('No canteen found for this vendor user. Please contact administrator.');
      }

      const vendorId = canteenResult.rows[0].vendor_id;
      console.log('Found vendorId for user:', vendorId);

      if (!name || !price || stockQuantity === undefined) {
        console.log('Validation failed - missing required fields');
        throw new ValidationError('Name, price, and stock quantity are required');
      }

      console.log('Creating product with vendorId:', vendorId);
      
      const product = await productService.createProduct({
        vendorId,
        name,
        description,
        price,
        category,
        imageUrl,
        stockQuantity,
      });

      console.log('Product created successfully:', product.id);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error: any) {
      console.error('=== CREATE PRODUCT ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // POST /api/v1/products/bulk - Bulk import products (Vendor only)
  router.post('/bulk', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      const { products } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new ValidationError('User ID not found in token');
      }

      // Get vendorId for this user
      const canteenResult = await pool.query(
        'SELECT vendor_id FROM canteens WHERE user_id = $1',
        [userId]
      );

      if (canteenResult.rows.length === 0) {
        throw new ValidationError('No canteen found for this vendor user');
      }

      const vendorId = canteenResult.rows[0].vendor_id;

      if (!Array.isArray(products) || products.length === 0) {
        throw new ValidationError('Products array is required');
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each product
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
          // Validate required fields
          if (!product.name || !product.price || product.stockQuantity === undefined) {
            throw new Error('Missing required fields');
          }

          // Validate category
          const validCategories = ['BREAKFAST', 'SNACKS', 'MAIN_COURSE', 'BEVERAGES', 'DESSERTS'];
          if (!validCategories.includes(product.category)) {
            throw new Error('Invalid category');
          }

          // Create product
          await productService.createProduct({
            vendorId,
            name: product.name,
            description: product.description || '',
            price: parseFloat(product.price),
            category: product.category,
            imageUrl: product.imageUrl || '',
            stockQuantity: parseInt(product.stockQuantity)
          });

          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push(`Row ${i + 2}: ${product.name || 'Unknown'} - ${error.message}`);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          success: successCount,
          failed: failedCount,
          errors: errors.slice(0, 10) // Limit to first 10 errors
        },
        message: `Imported ${successCount} products successfully`
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'BULK_IMPORT_FAILED',
          message: error.message
        }
      });
    }
  });

  // GET /api/v1/products/:id - Get product by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;

      const product = await productService.getProductById(productId);

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // GET /api/v1/products/vendor/:vendorId - Get products by vendor
  router.get('/vendor/:vendorId', authenticate, async (req: Request, res: Response) => {
    try {
      const vendorId = req.params.vendorId;
      const availableOnly = req.query.availableOnly === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      // Get products and total count in parallel for faster response
      const [products, totalCount] = await Promise.all([
        productService.getProductsByVendor(vendorId, availableOnly, limit, offset),
        productService.getProductsCount(vendorId, availableOnly)
      ]);

      res.json({
        success: true,
        data: products,
        count: products.length,
        total: totalCount,
        pagination: limit ? {
          limit,
          offset: offset || 0,
          hasMore: (offset || 0) + products.length < totalCount
        } : undefined
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // GET /api/v1/products/institution/:institutionId - Get products by institution
  router.get('/institution/:institutionId', authenticate, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.institutionId;
      const availableOnly = req.query.availableOnly !== 'false'; // Default to true

      const products = await productService.getProductsByInstitution(institutionId, availableOnly);

      res.json({
        success: true,
        data: products,
        count: products.length,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // PUT /api/v1/products/:id - Update product (Vendor only)
  router.put('/:id', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;

      const { name, description, price, category, imageUrl, stockQuantity, isAvailable } = req.body;

      const product = await productService.updateProduct(productId, {
        name,
        description,
        price,
        category,
        imageUrl,
        stockQuantity,
        isAvailable,
      });

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // PATCH /api/v1/products/:id/stock - Update stock quantity (Vendor only)
  router.patch('/:id/stock', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const { quantity } = req.body;

      if (quantity === undefined || quantity < 0) {
        throw new ValidationError('Valid quantity is required');
      }

      const product = await productService.updateStock(productId, quantity);

      res.json({
        success: true,
        data: product,
        message: 'Stock updated successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // GET /api/v1/products/vendor/:vendorId/low-stock - Get low stock products (Vendor only)
  router.get('/vendor/:vendorId/low-stock', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      const vendorId = req.params.vendorId;
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;

      const products = await productService.getLowStockProducts(vendorId, threshold);

      res.json({
        success: true,
        data: products,
        count: products.length,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // POST /api/v1/products/validate-cart - Validate cart items
  router.post('/validate-cart', authenticate, async (req: Request, res: Response) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        throw new ValidationError('Items array is required');
      }

      const validation = await productService.validateCartItems(items);

      res.json({
        success: validation.valid,
        data: validation,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // GET /api/v1/products/search - Search products
  router.get('/search', authenticate, async (req: Request, res: Response) => {
    try {
      const { institutionId, q, category } = req.query;

      if (!institutionId) {
        throw new ValidationError('Institution ID is required');
      }

      if (!q) {
        throw new ValidationError('Search query is required');
      }

      const products = await productService.searchProducts(
        institutionId as string,
        q as string,
        category as string
      );

      res.json({
        success: true,
        data: products,
        count: products.length,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // DELETE /api/v1/products/:id - Delete product (Vendor only)
  router.delete('/:id', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;

      const deleted = await productService.deleteProduct(productId);

      if (!deleted) {
        throw new NotFoundError('Product not found');
      }

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  return router;
};
