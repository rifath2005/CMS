const { createClient } = require('redis');
require('dotenv').config();

async function clearRateLimit() {
  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      tls: process.env.REDIS_TLS === 'true' ? { rejectUnauthorized: false } : undefined,
    },
    password: process.env.REDIS_PASSWORD,
  });

  try {
    console.log('Connecting to Redis...');
    await redisClient.connect();

    console.log('\nClearing all rate limit keys...');
    
    const keys = await redisClient.keys('rate_limit:*');
    
    if (keys.length === 0) {
      console.log('✅ No rate limit keys found - you should be able to login now!');
    } else {
      console.log(`Found ${keys.length} rate limit key(s)`);
      
      for (const key of keys) {
        await redisClient.del(key);
        console.log(`  ✓ Deleted: ${key}`);
      }
      
      console.log(`\n✅ Cleared ${keys.length} rate limit key(s)`);
    }
    
    console.log('\n🎉 You can now try logging in/signing up again!');
    
    await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Redis is running');
    console.log('2. Check your .env file has correct REDIS_* values');
    console.log('3. Or wait 15 minutes for rate limit to expire automatically');
    process.exit(1);
  }
}

clearRateLimit();
