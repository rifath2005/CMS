import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { ProductService } from '../services/product/ProductService';
import { authenticate } from '../middleware/auth.middleware';
import { requireVendor } from '../middleware/rbac.middleware';
import { ValidationError, NotFoundError } from '../utils/errors';
import { ProductCategory } from '../types';

export const createProductRouter = (pool: Pool): Router => {
  const router = Router();
  const productService = new ProductService(pool);

  // POST /api/v1/products - Create product (Vendor only)
  router.post('/', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      const { canteenId, name, description, price, category, imageUrl, stockQuantity } = req.body;

      if (!canteenId || !name || !price || !category || stockQuantity === undefined) {
        throw new ValidationError('Canteen ID, name, price, category, and stock quantity are required');
      }

      const product = await productService.createProduct({
        canteenId,
        name,
        description,
        price,
        category,
        imageUrl,
        stockQuantity,
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
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

  // GET /api/v1/products/:id - Get product by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        throw new ValidationError('Invalid product ID');
      }

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

  // GET /api/v1/products/canteen/:canteenId - Get products by canteen
  router.get('/canteen/:canteenId', authenticate, async (req: Request, res: Response) => {
    try {
      const canteenId = parseInt(req.params.canteenId);
      const availableOnly = req.query.availableOnly === 'true';

      if (isNaN(canteenId)) {
        throw new ValidationError('Invalid canteen ID');
      }

      const products = await productService.getProductsByCanteen(canteenId, availableOnly);

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

  // GET /api/v1/products/institution/:institutionId - Get products by institution
  router.get('/institution/:institutionId', authenticate, async (req: Request, res: Response) => {
    try {
      const institutionId = parseInt(req.params.institutionId);
      const availableOnly = req.query.availableOnly !== 'false'; // Default to true

      if (isNaN(institutionId)) {
        throw new ValidationError('Invalid institution ID');
      }

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
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        throw new ValidationError('Invalid product ID');
      }

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
      const productId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (isNaN(productId)) {
        throw new ValidationError('Invalid product ID');
      }

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

  // GET /api/v1/products/canteen/:canteenId/low-stock - Get low stock products (Vendor only)
  router.get('/canteen/:canteenId/low-stock', authenticate, requireVendor, async (req: Request, res: Response) => {
    try {
      const canteenId = parseInt(req.params.canteenId);
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;

      if (isNaN(canteenId)) {
        throw new ValidationError('Invalid canteen ID');
      }

      const products = await productService.getLowStockProducts(canteenId, threshold);

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
        parseInt(institutionId as string),
        q as string,
        category as ProductCategory
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
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        throw new ValidationError('Invalid product ID');
      }

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
