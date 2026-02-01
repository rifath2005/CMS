import { Pool, QueryResult } from 'pg';
import { Product } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ProductModel {
  constructor(private pool: Pool) {}

  /**
   * Transform database row to Product object with proper types
   */
  private transformProduct(row: any): Product {
    return {
      ...row,
      price: parseFloat(row.price),
      stockQuantity: parseInt(row.stock_quantity || row.stockQuantity),
      isAvailable: row.is_available ?? row.isAvailable,
      vendorId: row.vendor_id || row.vendorId,
      imageUrl: row.image_url || row.imageUrl,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt,
    };
  }

  /**
   * Create a new product
   */
  async create(productData: {
    vendorId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    imageUrl?: string;
    stockQuantity: number;
    isAvailable?: boolean;
  }): Promise<Product> {
    const {
      vendorId,
      name,
      description,
      price,
      category,
      imageUrl,
      stockQuantity,
      isAvailable = true,
    } = productData;

    // Validate price
    if (price <= 0) {
      throw new ValidationError('Price must be greater than 0');
    }

    // Validate stock quantity
    if (stockQuantity < 0) {
      throw new ValidationError('Stock quantity cannot be negative');
    }

    // Auto-set availability based on stock
    const availability = stockQuantity > 0 ? isAvailable : false;

    const query = `
      INSERT INTO products (vendor_id, name, description, price, category, image_url, stock_quantity, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      vendorId,
      name,
      description || null,
      price,
      category || null,
      imageUrl || null,
      stockQuantity,
      availability,
    ];

    try {
      const result: QueryResult = await this.pool.query(query, values);
      return this.transformProduct(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new ValidationError('Vendor does not exist');
      }
      throw error;
    }
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result: QueryResult = await this.pool.query(query, [id]);
    return result.rows[0] ? this.transformProduct(result.rows[0]) : null;
  }

  /**
   * Find all products for a vendor
   */
  async findByVendor(vendorId: string): Promise<Product[]> {
    const query = 'SELECT * FROM products WHERE vendor_id = $1 ORDER BY name';
    const result: QueryResult = await this.pool.query(query, [vendorId]);
    return result.rows.map(row => this.transformProduct(row));
  }

  /**
   * Find available products for a vendor
   */
  async findAvailableByVendor(vendorId: string): Promise<Product[]> {
    const query = `
      SELECT * FROM products 
      WHERE vendor_id = $1 AND is_available = true AND stock_quantity > 0
      ORDER BY name
    `;
    const result: QueryResult = await this.pool.query(query, [vendorId]);
    return result.rows.map(row => this.transformProduct(row));
  }

  /**
   * Find products by institution (across all canteens)
   */
  async findByInstitution(institutionId: string): Promise<Product[]> {
    const query = `
      SELECT p.* FROM products p
      INNER JOIN canteens c ON p.vendor_id = c.vendor_id
      WHERE c.institution_id = $1 AND c.is_approved = true AND c.is_active = true
      ORDER BY c.name, p.name
    `;
    const result: QueryResult = await this.pool.query(query, [institutionId]);
    return result.rows.map(row => this.transformProduct(row));
  }

  /**
   * Find available products by institution
   */
  async findAvailableByInstitution(institutionId: string): Promise<Product[]> {
    const query = `
      SELECT p.* FROM products p
      INNER JOIN canteens c ON p.vendor_id = c.vendor_id
      WHERE c.institution_id = $1 
        AND c.is_approved = true 
        AND c.is_active = true
        AND p.is_available = true 
        AND p.stock_quantity > 0
      ORDER BY c.name, p.name
    `;
    const result: QueryResult = await this.pool.query(query, [institutionId]);
    return result.rows.map(row => this.transformProduct(row));
  }

  /**
   * Update product
   */
  async update(
    id: string,
    updates: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      imageUrl?: string;
      stockQuantity?: number;
      isAvailable?: boolean;
    }
  ): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.price !== undefined) {
      if (updates.price <= 0) {
        throw new ValidationError('Price must be greater than 0');
      }
      fields.push(`price = $${paramCount++}`);
      values.push(updates.price);
    }

    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(updates.category);
    }

    if (updates.imageUrl !== undefined) {
      fields.push(`image_url = $${paramCount++}`);
      values.push(updates.imageUrl);
    }

    if (updates.stockQuantity !== undefined) {
      if (updates.stockQuantity < 0) {
        throw new ValidationError('Stock quantity cannot be negative');
      }
      fields.push(`stock_quantity = $${paramCount++}`);
      values.push(updates.stockQuantity);

      // Auto-update availability based on stock
      if (updates.stockQuantity === 0) {
        fields.push(`is_available = $${paramCount++}`);
        values.push(false);
      }
    }

    if (updates.isAvailable !== undefined) {
      // Only allow setting to true if stock > 0
      if (updates.isAvailable && product.stockQuantity === 0) {
        throw new ValidationError('Cannot set product as available when stock is 0');
      }
      fields.push(`is_available = $${paramCount++}`);
      values.push(updates.isAvailable);
    }

    if (fields.length === 0) {
      throw new ValidationError('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result: QueryResult = await this.pool.query(query, values);
    return this.transformProduct(result.rows[0]);
  }

  /**
   * Update stock quantity
   */
  async updateStock(id: string, quantity: number): Promise<Product> {
    if (quantity < 0) {
      throw new ValidationError('Stock quantity cannot be negative');
    }

    const query = `
      UPDATE products
      SET stock_quantity = $1,
          is_available = CASE WHEN $1 > 0 THEN is_available ELSE false END,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result: QueryResult = await this.pool.query(query, [quantity, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    return this.transformProduct(result.rows[0]);
  }

  /**
   * Decrease stock quantity (for order placement)
   */
  async decreaseStock(id: string, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity - $1,
          is_available = CASE WHEN (stock_quantity - $1) > 0 THEN is_available ELSE false END,
          updated_at = NOW()
      WHERE id = $2 AND stock_quantity >= $1
      RETURNING *
    `;

    const result: QueryResult = await this.pool.query(query, [quantity, id]);

    if (result.rows.length === 0) {
      const product = await this.findById(id);
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      throw new ValidationError('Insufficient stock');
    }

    return this.transformProduct(result.rows[0]);
  }

  /**
   * Check if product is available for ordering
   */
  async isAvailableForOrder(id: string, quantity: number): Promise<boolean> {
    const query = `
      SELECT id FROM products 
      WHERE id = $1 AND is_available = true AND stock_quantity >= $2
    `;
    const result = await this.pool.query(query, [id, quantity]);
    return result.rows.length > 0;
  }

  /**
   * Get low stock products for a vendor
   */
  async getLowStockProducts(vendorId: string, threshold: number = 10): Promise<Product[]> {
    const query = `
      SELECT * FROM products 
      WHERE vendor_id = $1 AND stock_quantity <= $2 AND stock_quantity > 0
      ORDER BY stock_quantity ASC
    `;
    const result: QueryResult = await this.pool.query(query, [vendorId, threshold]);
    return result.rows.map(row => this.transformProduct(row));
  }

  /**
   * Delete product
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Search products by name or category
   */
  async search(institutionId: string, searchTerm: string, category?: string): Promise<Product[]> {
    let query = `
      SELECT p.* FROM products p
      INNER JOIN canteens c ON p.vendor_id = c.vendor_id
      WHERE c.institution_id = $1 
        AND c.is_approved = true 
        AND c.is_active = true
        AND p.is_available = true 
        AND p.stock_quantity > 0
        AND LOWER(p.name) LIKE LOWER($2)
    `;

    const values: any[] = [institutionId, `%${searchTerm}%`];

    if (category) {
      query += ` AND p.category = $3`;
      values.push(category);
    }

    query += ` ORDER BY p.name`;

    const result: QueryResult = await this.pool.query(query, values);
    return result.rows.map(row => this.transformProduct(row));
  }
}
