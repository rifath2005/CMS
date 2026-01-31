import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { CartService, CartItem } from '../services/cart/CartService';

export function createCartRoutes(pool: Pool): Router {
  const router = Router();
  const cartService = new CartService(pool);

  /**
   * POST /api/cart/items
   * Add item to cart
   */
  router.post('/items', async (req: Request, res: Response) => {
    try {
      const { userId, productId, productName, quantity, price, imageUrl, vendorId } = req.body;

      if (!userId || !productId || !quantity || !price || !vendorId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'userId, productId, quantity, price, and vendorId are required'
          }
        });
      }

      const item: CartItem = {
        productId,
        productName,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        imageUrl,
        vendorId
      };

      const cart = await cartService.addItem(userId, item);

      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'ADD_ITEM_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/cart/:userId
   * Get cart for user
   */
  router.get('/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const cart = await cartService.getCart(userId);

      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_CART_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * DELETE /api/cart/:userId/items/:productId
   * Remove item from cart
   */
  router.delete('/:userId/items/:productId', async (req: Request, res: Response) => {
    try {
      const { userId, productId } = req.params;

      const cart = await cartService.removeItem(userId, productId);

      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'REMOVE_ITEM_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * PUT /api/cart/:userId/items/:productId
   * Update item quantity
   */
  router.put('/:userId/items/:productId', async (req: Request, res: Response) => {
    try {
      const { userId, productId } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined) {
        return res.status(400).json({
          error: {
            code: 'MISSING_QUANTITY',
            message: 'Quantity is required'
          }
        });
      }

      const cart = await cartService.updateItemQuantity(userId, productId, parseInt(quantity));

      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'UPDATE_QUANTITY_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * DELETE /api/cart/:userId
   * Clear cart
   */
  router.delete('/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      await cartService.clearCart(userId);

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'CLEAR_CART_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/cart/:userId/validate
   * Validate cart items
   */
  router.get('/:userId/validate', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const validation = await cartService.validateCart(userId);

      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'VALIDATE_CART_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/cart/:userId/count
   * Get cart item count
   */
  router.get('/:userId/count', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const count = await cartService.getItemCount(userId);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_COUNT_FAILED',
          message: error.message
        }
      });
    }
  });

  return router;
}
