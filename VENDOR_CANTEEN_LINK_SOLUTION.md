# Vendor-Canteen Linking Solution

## Overview
This solution links vendor users to canteens through a `user_id` field in the canteens table, avoiding the need to add `vendor_id` to the users table.

## Database Schema

### Canteens Table (Updated)
```sql
CREATE TABLE canteens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
  vendor_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NEW FIELD
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  operating_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationship Flow
```
User (UUID id, role='VENDOR')
    ↓ (user_id)
Canteen (UUID id, VARCHAR vendor_id, UUID user_id)
    ↓ (vendor_id)
Product (UUID id, VARCHAR vendor_id)
```

## How It Works

### 1. Creating a Canteen with Vendor User

**Endpoint:** `POST /api/v1/institutions/:institutionId/canteens-with-vendor`

**Request:**
```json
{
  "canteenName": "New Cafeteria",
  "location": "Building A",
  "vendorEmail": "vendor@institution.edu",
  "vendorPassword": "password123",
  "vendorName": "John Doe"
}
```

**Process:**
1. Create vendor user in `users` table
2. Create canteen in `canteens` table with `user_id` linking to the vendor user
3. Auto-generate `vendor_id` (e.g., "MIT-001")

### 2. Creating Products

When a vendor creates a product:

1. **Frontend** sends product data (without vendorId)
2. **Backend** extracts `userId` from JWT token
3. **Backend** queries canteen: `SELECT vendor_id FROM canteens WHERE user_id = $1`
4. **Backend** uses the `vendor_id` to create the product

**Product Route:**
```typescript
// Get userId from JWT
const userId = (req as any).user?.userId;

// Query canteen to get vendor_id
const canteenResult = await pool.query(
  'SELECT vendor_id FROM canteens WHERE user_id = $1',
  [userId]
);

const vendorId = canteenResult.rows[0].vendor_id;

// Create product with vendor_id
await productService.createProduct({ vendorId, ...productData });
```

### 3. Frontend Fetching vendorId

**Vendor Dashboard/Products Page:**
```typescript
const [vendorId, setVendorId] = useState<string | null>(null)

useEffect(() => {
  if (user?.id) {
    fetchVendorId()
  }
}, [user])

const fetchVendorId = async () => {
  try {
    const response = await api.get(`/canteens/user/${user?.id}`)
    if (response.data.data) {
      setVendorId(response.data.data.vendorId)
    }
  } catch (error) {
    console.error('Failed to fetch vendor ID:', error)
  }
}
```

## API Endpoints

### Get Canteen by User ID
```
GET /api/v1/canteens/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "canteen-uuid",
    "institutionId": "institution-uuid",
    "vendorId": "MIT-CF-003",
    "userId": "user-uuid",
    "name": "Cafeteria",
    "location": "Building A",
    "isActive": true,
    "isApproved": true
  }
}
```

### Create Product (Vendor)
```
POST /api/v1/products
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Tea",
  "description": "Hot tea",
  "price": 12,
  "category": "Beverages",
  "stockQuantity": 50,
  "imageUrl": "https://example.com/tea.jpg"
}
```

Note: `vendorId` is NOT sent - it's looked up from the canteen linked to the user.

## Advantages of This Approach

1. **No User Table Modification**: Users table remains clean without vendor-specific fields
2. **Clear Ownership**: Canteens table explicitly shows which user owns each canteen
3. **Flexible**: One user could potentially manage multiple canteens (if needed in future)
4. **Secure**: Vendor can only create products for their own canteen
5. **Simple Queries**: Easy to find canteen for a user or user for a canteen

## Migration Steps

### 1. Update Database Schema
Run the updated schema.sql or execute:
```sql
ALTER TABLE canteens 
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
```

### 2. Link Existing Vendors to Canteens
```sql
UPDATE canteens SET user_id = '44444444-4444-4444-4444-444444444444' WHERE vendor_id = 'MIT-MC-001';
UPDATE canteens SET user_id = '55555555-5555-5555-5555-555555555555' WHERE vendor_id = 'MIT-SS-002';
UPDATE canteens SET user_id = '66666666-6666-6666-6666-666666666666' WHERE vendor_id = 'MIT-CF-003';
UPDATE canteens SET user_id = '77777777-7777-7777-7777-777777777777' WHERE vendor_id = 'VIT-FC-001';
```

### 3. Reset Database (Recommended)
```bash
npm run reset-db
```

This will recreate all tables with the new schema and seed data with proper links.

## Testing

### 1. Login as Vendor
```bash
POST /api/v1/auth/login
{
  "email": "vendor.cafeteria@mitcoe.edu",
  "password": "password123"
}
```

### 2. Get Vendor's Canteen
```bash
GET /api/v1/canteens/user/66666666-6666-6666-6666-666666666666
```

Should return canteen with `vendorId: "MIT-CF-003"`

### 3. Create Product
```bash
POST /api/v1/products
Authorization: Bearer <jwt-token>
{
  "name": "Tea",
  "price": 12,
  "category": "Beverages",
  "stockQuantity": 50
}
```

Product will be created with `vendor_id = "MIT-CF-003"` (looked up from canteen).

## Summary

- **Users table**: No changes needed
- **Canteens table**: Added `user_id` field to link to vendor users
- **Products**: Use `vendor_id` from canteen (looked up by `user_id`)
- **Frontend**: Fetches `vendorId` from canteen API before making product requests
- **Backend**: Queries canteen to get `vendor_id` when creating products

This approach keeps the schema clean while maintaining the proper relationships between users, canteens, and products.
