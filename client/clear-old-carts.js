// Script to clear old shared cart data from localStorage
// Run this once to clean up the old 'cart-storage' key that was shared between users

console.log('Clearing old shared cart data...\n');

try {
  // Check if old cart-storage exists
  const oldCart = localStorage.getItem('cart-storage');
  
  if (oldCart) {
    console.log('Found old shared cart data:');
    console.log(oldCart);
    
    // Remove it
    localStorage.removeItem('cart-storage');
    console.log('\n✅ Removed old shared cart data');
    console.log('\nEach user will now have their own cart!');
    console.log('Cart keys will be: cart-storage-{userId}');
  } else {
    console.log('✅ No old shared cart data found');
    console.log('System is already using user-specific carts');
  }
  
  // Show all cart-related keys
  console.log('\nCurrent cart keys in localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cart-storage')) {
      console.log(`  - ${key}`);
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n✅ Done! Refresh the page to see changes.');
