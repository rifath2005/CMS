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
      const { vendorId, name, description, price, category, imageUrl, stockQuantity } = req.body;

      if (!vendorId || !name || !price || stockQuantity === undefined) {
        throw new ValidationError('Vendor ID, name, price, and stock quantity are required');
      }

      const product = await productService.createProduct({
        vendorId,
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

      const products = await productService.getProductsByVendor(vendorId, availableOnly);

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
