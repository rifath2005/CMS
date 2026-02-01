# Test Credentials & Database Information

## Database Successfully Seeded! 🎉

Your database now contains functional test data with proper relationships between institutions, users, canteens, and products.

## Login Credentials

All test users have the password: **`password123`**

### Students (Regular Users)
- **john.doe@mitcoe.edu** - MIT College student
- **jane.smith@mitcoe.edu** - MIT College student  
- **rahul.verma@mitcoe.edu** - MIT College student
- **priya.singh@mitcoe.edu** - MIT College student
- **amit.kumar@mitcoe.edu** - MIT College student
- **sarah.johnson@vit.edu** - VIT University student
- **michael.brown@vit.edu** - VIT University student

### Vendors
- **vendor.maincanteen@mitcoe.edu** - Main Canteen (MIT-MC-001)
- **vendor.snackshop@mitcoe.edu** - Snack Shop (MIT-SS-002)
- **vendor.cafeteria@mitcoe.edu** - Cafeteria (MIT-CF-003)
- **vendor.foodcourt@vit.edu** - Food Court (VIT-FC-001)

### Institution Admins
- **admin@mitcoe.edu** - MIT College Admin
- **admin@vit.edu** - VIT University Admin

## Database Contents

### Institutions (3)
1. **MIT College of Engineering** (mitcoe.edu)
2. **VIT University** (vit.edu)
3. **IIT Bombay** (iitb.edu)

### Canteens (4)
1. **Main Canteen** - MIT College (MIT-MC-001)
   - Location: Ground Floor, Main Building
   - Hours: 7:00 AM - 9:00 PM (Mon-Fri)
   - 25 products (Breakfast, Snacks, Main Course, Beverages, Desserts)

2. **Snack Shop** - MIT College (MIT-SS-002)
   - Location: First Floor, Library Building
   - Hours: 8:00 AM - 7:00 PM (Mon-Fri)
   - 9 products (Snacks & Beverages)

3. **Cafeteria** - MIT College (MIT-CF-003)
   - Location: Second Floor, Engineering Block
   - Hours: 9:00 AM - 6:00 PM (Mon-Fri)
   - 9 products (Italian cuisine, Coffee, Desserts)

4. **Food Court** - VIT University (VIT-FC-001)
   - Location: Ground Floor, Student Center
   - Hours: 7:00 AM - 10:00 PM (Daily)
   - 8 products (South Indian cuisine)

### Total Products: 51
- **Breakfast Items**: 8
- **Snacks**: 18
- **Main Course**: 13
- **Beverages**: 17
- **Desserts**: 5

### Product Features
- ✅ Realistic pricing (₹10 - ₹120)
- ✅ Stock quantities (0 - 200 units)
- ✅ Some out-of-stock items (Ice Cream, Brownie with Ice Cream)
- ✅ Some low-stock items (Spring Roll: 8, Pasta Arrabiata: 5)
- ✅ Product images from Unsplash
- ✅ Proper categorization

## Testing Scenarios

### As a Student
1. Login with `john.doe@mitcoe.edu`
2. Browse products from MIT College canteens
3. Add items to cart
4. Place orders
5. View order history

### As a Vendor
1. Login with `vendor.maincanteen@mitcoe.edu`
2. View incoming orders
3. Update order status (Preparing → Ready → Delivered)
4. Manage product inventory
5. View low-stock alerts

### As an Admin
1. Login with `admin@mitcoe.edu`
2. Manage institution settings
3. Approve/reject canteens
4. View analytics and reports

## Re-seeding the Database

If you need to reset the database with fresh data:

```bash
# Using the TypeScript script
npx ts-node scripts/seed-database.ts

# Or using the batch file (Windows)
scripts\seed-database.bat
```

## Notes

- All UUIDs are properly formatted
- Foreign key relationships are correctly established
- Canteen vendor_ids match the canteen records
- Products are linked to their respective canteens
- Users are properly assigned to institutions
- Password hashes are generated with bcrypt (10 rounds)

## Next Steps

1. Start your backend server: `npm run dev`
2. Start your frontend: `cd client && npm run dev`
3. Login with any of the test credentials above
4. Test the complete user flow!

Happy testing! 🚀
