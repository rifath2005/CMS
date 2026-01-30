import { Pool } from 'pg';
import { ProductModel } from '../../models/Product';
import { Product, ProductCategory } from '../../types';
import { ValidationError } from '../../utils/errors';

export class ProductService {
  private productModel: ProductModel;

  constructor(pool: Pool) {
    this.productModel = new ProductModel(pool);
  }

  /**
   * Create a new product
   */
  async createProduct(productData: {
    canteenId: number;
    name: string;
    description?: string;
    price: number;
    category: ProductCategory;
    imageUrl?: string;
    stockQuantity: number;
  }): Promise<Product> {
    // Validate required fields
    if (!productData.name || productData.name.trim().length === 0) {
      throw new ValidationError('Product name is required');
    }

    if (!productData.price || productData.price <= 0) {
      throw new ValidationError('Valid price is required');
    }

    if (!productData.category) {
      throw new ValidationError('Product category is required');
    }

    if (productData.stockQuantity === undefined || productData.stockQuantity < 0) {
      throw new ValidationError('Valid stock quantity is required');
    }

    return await this.productModel.create(productData);
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<Product | null> {
    return await this.productModel.findById(id);
  }

  /**
   * Get all products for a canteen
   */
  async getProductsByCanteen(canteenId: number, availableOnly: boolean = false): Promise<Product[]> {
    if (availableOnly) {
      return await this.productModel.findAvailableByCanteen(canteenId);
    }
    return await this.productModel.findByCanteen(canteenId);
  }

  /**
   * Get products by institution (for user browsing)
   */
  async getProductsByInstitution(institutionId: number, availableOnly: boolean = true): Promise<Product[]> {
    if (availableOnly) {
      return await this.productModel.findAvailableByInstitution(institutionId);
    }
    return await this.productModel.findByInstitution(institutionId);
  }

  /**
   * Update product
   */
  async updateProduct(
    id: number,
    updates: {
      name?: string;
      description?: string;
      price?: number;
      category?: ProductCategory;
      imageUrl?: string;
      stockQuantity?: number;
      isAvailable?: boolean;
    }
  ): Promise<Product> {
    return await this.productModel.update(id, updates);
  }

  /**
   * Update stock quantity
   */
  async updateStock(id: number, quantity: number): Promise<Product> {
    return await this.productModel.updateStock(id, quantity);
  }

  /**
   * Decrease stock (for order placement)
   */
  async decreaseStock(id: number, quantity: number): Promise<Product> {
    return await this.productModel.decreaseStock(id, quantity);
  }

  /**
   * Check if product is available for ordering
   */
  async isAvailableForOrder(id: number, quantity: number): Promise<boolean> {
    return await this.productModel.isAvailableForOrder(id, quantity);
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(canteenId: number, threshold: number = 10): Promise<Product[]> {
    return await this.productModel.getLowStockProducts(canteenId, threshold);
  }

  /**
   * Delete product
   */
  async deleteProduct(id: number): Promise<boolean> {
    return await this.productModel.delete(id);
  }

  /**
   * Search products
   */
  async searchProducts(
    institutionId: number,
    searchTerm: string,
    category?: ProductCategory
  ): Promise<Product[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError('Search term is required');
    }
    return await this.productModel.search(institutionId, searchTerm, category);
  }

  /**
   * Validate cart items before order placement
   */
  async validateCartItems(items: Array<{ productId: number; quantity: number }>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.productId);

      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      if (!product.is_available) {
        errors.push(`Product "${product.name}" is not available`);
        continue;
      }

      if (product.stock_quantity < item.quantity) {
        errors.push(
          `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`
        );
        continue;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
