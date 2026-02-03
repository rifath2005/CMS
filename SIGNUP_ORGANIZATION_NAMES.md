# Available Organization Names for Signup

## Current Issue
You're getting "Organization 'MIT' not found" because the database has "**MIT College of Engineering**" not just "MIT".

---

## Quick Fix Options

### Option 1: Use Full Name (Immediate)
Use the exact name from the database:
- ✅ **MIT College of Engineering** (not "MIT")
- ✅ **VIT University** (not "VIT")
- ✅ **IIT Bombay** (not "IIT")

### Option 2: Add Short Names to Database (Recommended)
Run this SQL script to add common short names:

```bash
# From CMS directory
psql $DATABASE_URL -f scripts/add-common-institution-names.sql
```

Or manually run in your database:
```sql
INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'MIT', 'mit.edu', 'admin@mit.edu', '+91-9876543213'),
  ('55555555-5555-5555-5555-555555555555', 'IIT', 'iit.edu', 'admin@iit.edu', '+91-9876543214')
ON CONFLICT (id) DO NOTHING;
```

---

## Check Available Organizations

### Method 1: Query Database
```sql
SELECT name FROM institutions ORDER BY name;
```

### Method 2: Use Check Script
```bash
cd CMS
npm run ts-node scripts/check-institutions.ts
```

---

## Current Institutions in Database

Based on your seed file, these are available:
1. **MIT College of Engineering**
2. **VIT University**
3. **IIT Bombay**

---

## Testing Signup

### Test 1: With Full Name
```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "organizationName": "MIT College of Engineering",
  "password": "Test1234"
}
```
✅ This will work

### Test 2: With Short Name (After running SQL script)
```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "organizationName": "MIT",
  "password": "Test1234"
}
```
✅ This will work after adding short names

---

## Add Your Own Institution

If you want to add a new institution:

```sql
INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone)
VALUES 
  (gen_random_uuid(), 'Your Institution Name', 'yourdomain.edu', 'admin@yourdomain.edu', '+91-1234567890');
```

---

## Frontend Improvement (Optional)

You could add a dropdown with autocomplete to show available organizations:

```typescript
// Fetch organizations from API
const [organizations, setOrganizations] = useState<string[]>([]);

useEffect(() => {
  fetch('/api/v1/institutions')
    .then(res => res.json())
    .then(data => setOrganizations(data.institutions.map(i => i.name)));
}, []);

// Use datalist for autocomplete
<input list="organizations" name="organizationName" />
<datalist id="organizations">
  {organizations.map(org => <option key={org} value={org} />)}
</datalist>
```

---

## Quick Commands

### Add MIT as short name
```bash
psql $DATABASE_URL -c "INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone) VALUES ('44444444-4444-4444-4444-444444444444', 'MIT', 'mit.edu', 'admin@mit.edu', '+91-9876543213') ON CONFLICT (id) DO NOTHING;"
```

### List all institutions
```bash
psql $DATABASE_URL -c "SELECT name FROM institutions ORDER BY name;"
```

### Check if MIT exists
```bash
psql $DATABASE_URL -c "SELECT * FROM institutions WHERE LOWER(name) = 'mit';"
```

---

## Recommended Solution

**For now**: Use "**MIT College of Engineering**" in the signup form.

**For better UX**: Run the SQL script to add short names:
```bash
cd CMS
psql $DATABASE_URL -f scripts/add-common-institution-names.sql
```

Then users can use either:
- "MIT" or "MIT College of Engineering"
- "VIT" or "VIT University"  
- "IIT" or "IIT Bombay"

---

## Error Messages

### "Organization 'XYZ' not found"
**Cause**: The organization name doesn't match any institution in the database (case-insensitive).

**Solution**: 
1. Check available institutions in database
2. Use exact name from database
3. Or add the organization to database

### Case Sensitivity
The system is **case-insensitive**, so these all work:
- "MIT College of Engineering"
- "mit college of engineering"
- "MIT COLLEGE OF ENGINEERING"

---

**Status**: Issue identified ✅  
**Solution**: Use full name or add short names to database  
**Files Created**: 
- `scripts/add-common-institution-names.sql`
- `scripts/add-mit-institution.sql`
- `SIGNUP_ORGANIZATION_NAMES.md`
