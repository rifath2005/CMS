import { redisClient, connectRedis } from '../src/config/redis';
import dotenv from 'dotenv';

dotenv.config();

async function clearRateLimit() {
  try {
    console.log('Connecting to Redis...');
    await connectRedis();

    console.log('\nClearing all rate limit keys...');
    
    // Get all rate limit keys
    const keys = await redisClient.keys('rate_limit:*');
    
    if (keys.length === 0) {
      console.log('✅ No rate limit keys found');
    } else {
      console.log(`Found ${keys.length} rate limit key(s)`);
      
      // Delete all rate limit keys
      for (const key of keys) {
        await redisClient.del(key);
        console.log(`  ✓ Deleted: ${key}`);
      }
      
      console.log(`\n✅ Cleared ${keys.length} rate limit key(s)`);
    }
    
    console.log('\nYou can now try logging in again!');
    
    await redisClient.quit();
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

clearRateLimit();
