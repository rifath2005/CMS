# Setup Guide - Canteen Management System

This guide will help you set up the development environment for the Canteen Management System.

## Prerequisites Installation

### 1. Install Node.js and npm

#### Ubuntu/Debian:
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### macOS:
```bash
# Using Homebrew
brew install node@18

# Verify installation
node --version
npm --version
```

#### Windows:
Download and install from [nodejs.org](https://nodejs.org/)

### 2. Install PostgreSQL

#### Ubuntu/Debian:
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Create database and user
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE canteen_management;
CREATE USER canteen_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE canteen_management TO canteen_user;
\q
```

#### macOS:
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb canteen_management
```

#### Windows:
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 3. Install Redis

#### Ubuntu/Debian:
```bash
# Install Redis
sudo apt-get install -y redis-server

# Start Redis service
sudo service redis-server start

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### macOS:
```bash
# Using Homebrew
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping
```

#### Windows:
Download from [redis.io](https://redis.io/download) or use WSL

## Project Setup

### 1. Install Project Dependencies

```bash
# Navigate to project directory
cd canteen-management-system

# Install dependencies
npm install
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

Required configuration in `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=canteen_management
DB_USER=canteen_user
DB_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_in_production
SESSION_SECRET=your_session_secret_here_change_in_production
```

### 3. Initialize Database

```bash
# Initialize database schema
npm run db:init
```

This will:
- Create all required tables
- Set up indexes and constraints
- Create a default admin user

Default admin credentials:
- Email: `admin@system.com`
- Password: `admin123`
- **⚠️ Change this password immediately in production!**

### 4. Verify Setup

```bash
# Run tests to verify everything is working
npm test
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Mode
```bash
# Build the project
npm run build

# Start the server
npm start
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Database Management

### Initialize Database
```bash
npm run db:init
```

### Reset Database (Development Only)
```bash
npm run db:reset
```

**⚠️ Warning**: This will delete all data!

## Troubleshooting

### PostgreSQL Connection Issues

1. Check if PostgreSQL is running:
```bash
sudo service postgresql status
```

2. Verify connection:
```bash
psql -h localhost -U canteen_user -d canteen_management
```

3. Check PostgreSQL logs:
```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Redis Connection Issues

1. Check if Redis is running:
```bash
sudo service redis-server status
```

2. Test connection:
```bash
redis-cli ping
```

3. Check Redis logs:
```bash
sudo tail -f /var/log/redis/redis-server.log
```

### Port Already in Use

If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Permission Issues

If you encounter permission issues with PostgreSQL:
```bash
# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE canteen_management TO canteen_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO canteen_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO canteen_user;
```

## Development Workflow

1. **Start Services**:
   ```bash
   sudo service postgresql start
   sudo service redis-server start
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Run Tests**:
   ```bash
   npm test
   ```

4. **Check API**:
   ```bash
   curl http://localhost:3000/health
   ```

## Next Steps

After completing the setup:

1. Review the specification documents in the `SD/` folder
2. Follow the implementation tasks in `SD/tasks.md`
3. Implement authentication service (Task 2)
4. Write tests for each feature
5. Use property-based testing with fast-check

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [fast-check Property Testing](https://github.com/dubzzz/fast-check)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the specification documents in `SD/`
3. Check the test files for examples
4. Consult the README.md for project overview
