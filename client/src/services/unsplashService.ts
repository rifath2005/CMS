// Unsplash image search service with optimized queries
// Uses Unsplash Search API with smart query optimization

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_ACCESS_KEY = 'RZEIOVfPhS7vMLkFdd2TSKGFBS4o9_FmcV1Nje3FSjw';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
}

/**
 * Optimize search query for better results
 */
function optimizeSearchQuery(productName: string): string[] {
  const normalized = productName.toLowerCase().trim();
  
  // Try multiple query variations for better results
  const queries = [
    normalized, // Original name
    `${normalized} food`, // With "food"
    `indian ${normalized}`, // With "indian"
  ];
  
  // Add specific variations for common items
  const variations: { [key: string]: string[] } = {
    'gulab jamun': ['gulab jamun', 'indian sweet', 'indian dessert'],
    'rasgulla': ['rasgulla', 'indian sweet', 'bengali sweet'],
    'jalebi': ['jalebi', 'indian sweet', 'orange sweet'],
    'samosa': ['samosa', 'indian snack', 'fried snack'],
    'dosa': ['dosa', 'south indian', 'crepe'],
    'idli': ['idli', 'south indian', 'steamed cake'],
    'biryani': ['biryani', 'rice dish', 'indian rice'],
    'chai': ['chai', 'indian tea', 'masala tea'],
    'lassi': ['lassi', 'yogurt drink', 'indian drink'],
  };
  
  // Check if we have specific variations
  for (const [key, values] of Object.entries(variations)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return values;
    }
  }
  
  return queries;
}

/**
 * Search Unsplash with optimized queries
 */
export async function searchUnsplashImages(
  query: string,
  perPage: number = 10
): Promise<string[]> {
  try {
    // Get optimized query variations
    const queries = optimizeSearchQuery(query);
    console.log('🔍 Trying queries:', queries);
    
    // Try each query until we get results
    for (const searchQuery of queries) {
      // Random page between 1-3 for variety (reduced from 5 for better relevance)
      const randomPage = Math.floor(Math.random() * 3) + 1;
      
      console.log('📡 Searching Unsplash:', searchQuery, 'page:', randomPage);
      
      const url = new URL(UNSPLASH_API_URL);
      url.searchParams.append('query', searchQuery);
      url.searchParams.append('per_page', perPage.toString());
      url.searchParams.append('page', randomPage.toString());
      url.searchParams.append('client_id', UNSPLASH_ACCESS_KEY);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        console.error('❌ Unsplash API failed:', response.status);
        continue;
      }

      const data = await response.json();
      console.log('✅ Unsplash returned', data.results.length, 'images for:', searchQuery);
      
      if (data.results.length > 0) {
        const imageUrls = data.results.map((img: UnsplashImage) => 
          `${img.urls.raw}&w=400&h=300&fit=crop&q=80`
        );
        return imageUrls;
      }
    }
    
    console.warn('⚠️ No results for any query variation');
    return [];
  } catch (error) {
    console.error('❌ Unsplash error:', error);
    return [];
  }
}

/**
 * Deduplicate images - remove already used URLs
 */
function deduplicateImages(newImages: string[], usedImages: string[]): string[] {
  return newImages.filter(img => !usedImages.includes(img));
}

/**
 * Get images for a specific product with deduplication
 */
export async function getImagesForProduct(
  productName: string,
  category: string,
  usedImageUrls: string[] = []
): Promise<string[]> {
  console.log('🍽️ Getting images for:', productName, 'category:', category);
  console.log('📋 Excluding', usedImageUrls.length, 'used images');
  
  // Search for the specific product
  const productImages = await searchUnsplashImages(productName, 15);
  
  // Deduplicate
  let freshImages = deduplicateImages(productImages, usedImageUrls);
  console.log('✨ Fresh product images:', freshImages.length);
  
  // If we have enough fresh images, return them
  if (freshImages.length >= 4) {
    return freshImages;
  }
  
  // Otherwise, try category fallback
  console.log('⚠️ Not enough product images, trying category fallback');
  
  const categoryQueries: { [key: string]: string } = {
    'BEVERAGES': 'indian drinks',
    'BREAKFAST': 'indian breakfast',
    'MAIN_COURSE': 'indian food',
    'SNACKS': 'indian snacks',
    'DESSERTS': 'indian sweets'
  };

  const categoryQuery = categoryQueries[category] || 'indian food';
  const categoryImages = await searchUnsplashImages(categoryQuery, 15);
  
  // Combine and deduplicate
  const allImages = [...freshImages, ...categoryImages];
  freshImages = deduplicateImages(allImages, usedImageUrls);
  
  console.log('📦 Total fresh images:', freshImages.length);
  return freshImages;
}

/**
 * Shuffle images for variety
 */
export function shuffleImages(images: string[]): string[] {
  const shuffled = [...images];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}



