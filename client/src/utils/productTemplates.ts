// Product description templates and image suggestions
// Uses multi-provider image search (Unsplash + Pexels) with deduplication

import { getImagesForProduct, shuffleImages } from '../services/unsplashService';

interface ProductTemplate {
  keywords: string[]
  descriptions: string[]
  images: string[]
}

interface CategoryTemplates {
  [key: string]: ProductTemplate
}

// Template database for different food categories
const productTemplates: CategoryTemplates = {
  BEVERAGES: {
    keywords: ['coffee', 'tea', 'juice', 'shake', 'smoothie', 'lassi', 'milk', 'water', 'soda', 'cola'],
    descriptions: [
      'Refreshing beverage perfect for any time of day',
      'Freshly prepared drink to quench your thirst',
      'Premium quality beverage made with finest ingredients',
      'Delicious and energizing drink',
      'Traditional beverage with authentic taste'
    ],
    images: [
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop'
    ]
  },
  BREAKFAST: {
    keywords: ['dosa', 'idli', 'vada', 'upma', 'poha', 'paratha', 'puri', 'uttapam', 'sandwich', 'toast'],
    descriptions: [
      'Wholesome breakfast item to start your day right',
      'Traditional breakfast delicacy made fresh',
      'Nutritious morning meal prepared with care',
      'Classic breakfast favorite with authentic flavors',
      'Delicious breakfast option served hot and fresh'
    ],
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop'
    ]
  },
  MAIN_COURSE: {
    keywords: ['rice', 'biryani', 'curry', 'dal', 'roti', 'naan', 'paneer', 'chicken', 'meal', 'thali'],
    descriptions: [
      'Hearty main course meal with rich flavors',
      'Satisfying dish prepared with authentic spices',
      'Complete meal option with balanced nutrition',
      'Traditional main course with homestyle taste',
      'Delicious and filling meal served fresh'
    ],
    images: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop'
    ]
  },
  SNACKS: {
    keywords: ['samosa', 'pakora', 'bhaji', 'cutlet', 'roll', 'chaat', 'tikki', 'chips', 'bonda', 'vada'],
    descriptions: [
      'Crispy and delicious snack perfect for tea time',
      'Popular snack item with irresistible taste',
      'Quick bite option made fresh and hot',
      'Crunchy snack with authentic flavors',
      'Tasty treat to satisfy your cravings'
    ],
    images: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1562059390-a761a084768e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop'
    ]
  },
  DESSERTS: {
    keywords: ['ice cream', 'cake', 'sweet', 'halwa', 'kheer', 'gulab jamun', 'jalebi', 'ladoo', 'barfi', 'pudding'],
    descriptions: [
      'Sweet treat to end your meal perfectly',
      'Delightful dessert with rich taste',
      'Traditional sweet made with premium ingredients',
      'Indulgent dessert option for sweet lovers',
      'Delicious sweet dish prepared fresh'
    ],
    images: [
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop'
    ]
  }
}

// Specific product templates for common items
const specificProducts: { [key: string]: { description: string; image: string } } = {
  // Beverages
  'coffee': { description: 'Aromatic coffee brewed to perfection', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop' },
  'filter coffee': { description: 'Traditional South Indian filter coffee', image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop' },
  'tea': { description: 'Hot tea with perfect blend of spices', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop' },
  'chai': { description: 'Indian masala chai with aromatic spices', image: 'https://images.unsplash.com/photo-1597318181409-cf64992eec8b?w=400&h=300&fit=crop' },
  'masala chai': { description: 'Spiced Indian tea with milk', image: 'https://images.unsplash.com/photo-1597318181409-cf64992eec8b?w=400&h=300&fit=crop' },
  'lassi': { description: 'Creamy yogurt-based traditional drink', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop' },
  'mango lassi': { description: 'Sweet mango yogurt drink', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop' },
  'juice': { description: 'Fresh fruit juice packed with vitamins', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop' },
  'orange juice': { description: 'Freshly squeezed orange juice', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop' },
  'lemon juice': { description: 'Refreshing lemon juice with mint', image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=400&h=300&fit=crop' },
  'milkshake': { description: 'Creamy milkshake in various flavors', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
  'smoothie': { description: 'Healthy fruit smoothie blend', image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop' },
  'cold coffee': { description: 'Iced coffee with milk and ice cream', image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop' },
  'hot chocolate': { description: 'Rich hot chocolate drink', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=300&fit=crop' },
  
  // Breakfast
  'dosa': { description: 'Crispy rice crepe with potato filling', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop' },
  'masala dosa': { description: 'South Indian crispy dosa with spiced potato', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop' },
  'plain dosa': { description: 'Crispy plain rice crepe', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop' },
  'idli': { description: 'Soft steamed rice cakes served with chutney', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop' },
  'vada': { description: 'Crispy lentil fritters served hot', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
  'medu vada': { description: 'South Indian lentil donuts', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
  'upma': { description: 'Savory semolina porridge with vegetables', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'poha': { description: 'Flattened rice with peanuts and spices', image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
  'paratha': { description: 'Layered flatbread with filling', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'aloo paratha': { description: 'Potato stuffed flatbread', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'puri': { description: 'Deep fried puffed bread', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'uttapam': { description: 'Thick rice pancake with toppings', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop' },
  
  // Main Course
  'biryani': { description: 'Aromatic rice dish with spices and meat', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop' },
  'chicken biryani': { description: 'Fragrant rice with tender chicken', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop' },
  'veg biryani': { description: 'Vegetable biryani with aromatic spices', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop' },
  'dal': { description: 'Lentil curry cooked with aromatic spices', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
  'dal tadka': { description: 'Tempered lentils with steamed rice', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop' },
  'dal fry': { description: 'Fried lentils with spices', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
  'paneer': { description: 'Cottage cheese curry with rich gravy', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop' },
  'paneer butter masala': { description: 'Cottage cheese in creamy tomato gravy', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop' },
  'palak paneer': { description: 'Cottage cheese in spinach gravy', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop' },
  'chole': { description: 'Spiced chickpeas with fried bread', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop' },
  'chole bhature': { description: 'Chickpea curry with fried bread', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop' },
  'rajma': { description: 'Red kidney beans curry', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
  'rice': { description: 'Steamed basmati rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop' },
  'fried rice': { description: 'Stir-fried rice with vegetables', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop' },
  'roti': { description: 'Whole wheat flatbread', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'naan': { description: 'Leavened flatbread from tandoor', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  
  // Snacks
  'samosa': { description: 'Crispy pastry filled with spiced potatoes', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
  'pakora': { description: 'Deep-fried vegetable fritters', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'vada pav': { description: 'Spicy potato fritter in a bun', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop' },
  'pav bhaji': { description: 'Spiced vegetable mash with bread', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'chaat': { description: 'Tangy street food snack', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
  'bhel puri': { description: 'Puffed rice snack with chutneys', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
  'pani puri': { description: 'Crispy shells with spiced water', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
  'aloo tikki': { description: 'Spiced potato patties', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'cutlet': { description: 'Crispy vegetable cutlet', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=300&fit=crop' },
  'spring roll': { description: 'Crispy vegetable spring rolls', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop' },
  'french fries': { description: 'Crispy golden potato fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
  'sandwich': { description: 'Grilled vegetable sandwich', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop' },
  
  // Desserts
  'ice cream': { description: 'Creamy frozen dessert in various flavors', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop' },
  'gulab jamun': { description: 'Sweet milk dumplings in sugar syrup', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop' },
  'kheer': { description: 'Creamy rice pudding with cardamom', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
  'rasmalai': { description: 'Cottage cheese dumplings in sweet milk', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
  'jalebi': { description: 'Crispy sweet spirals in sugar syrup', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop' },
  'rasgulla': { description: 'Spongy cottage cheese balls in syrup', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop' },
  'halwa': { description: 'Sweet dense pudding dessert', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
  'gajar halwa': { description: 'Carrot pudding with nuts', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
  'cake': { description: 'Soft sponge cake with frosting', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop' },
  'brownie': { description: 'Rich chocolate brownie', image: 'https://images.unsplash.com/photo-1564355808853-07fccee1b513?w=400&h=300&fit=crop' },
  'pudding': { description: 'Creamy sweet pudding', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' }
}

export async function generateProductSuggestions(
  productName: string, 
  category: string, 
  usedImageUrls: string[] = []
): Promise<{
  descriptions: string[]
  images: string[]
}> {
  console.log('🎯 generateProductSuggestions:', productName, category);
  console.log('📋 Used images to exclude:', usedImageUrls.length);
  
  const normalizedName = productName.toLowerCase().trim()
  const normalizedCategory = category.toUpperCase()
  
  // Check for specific product match first
  const specificMatch = Object.keys(specificProducts).find(key => 
    normalizedName.includes(key) || key.includes(normalizedName)
  )
  
  const categoryTemplate = productTemplates[normalizedCategory] || productTemplates.SNACKS
  
  // Fetch images from multiple providers with deduplication
  let images: string[] = [];
  try {
    console.log('📞 Fetching images from Unsplash + Pexels...');
    const fetchedImages = await getImagesForProduct(productName, category, usedImageUrls);
    console.log('📦 Received', fetchedImages.length, 'fresh images');
    
    if (fetchedImages.length === 0) {
      console.log('⚠️ No API images, using fallback static images');
      // Shuffle static images for variety
      images = shuffleImages(categoryTemplate.images).slice(0, 8);
    } else {
      // Shuffle and take up to 8 images
      images = shuffleImages(fetchedImages).slice(0, 8);
      console.log('✅ Using', images.length, 'API images');
    }
  } catch (error) {
    console.error('❌ Error fetching images:', error);
    // Fallback to shuffled static images
    images = shuffleImages(categoryTemplate.images).slice(0, 8);
  }
  
  if (specificMatch) {
    const specific = specificProducts[specificMatch]
    
    return {
      descriptions: [specific.description, ...categoryTemplate.descriptions.slice(0, 2)],
      images
    }
  }
  
  // Check if product name matches any keywords for better descriptions
  const matchingKeyword = categoryTemplate.keywords.find(keyword => 
    normalizedName.includes(keyword) || keyword.includes(normalizedName)
  )
  
  if (matchingKeyword) {
    const customDescriptions = [
      `Delicious ${productName.toLowerCase()} made fresh daily`,
      `Authentic ${productName.toLowerCase()} with traditional taste`,
      ...categoryTemplate.descriptions.slice(0, 2)
    ]
    
    return {
      descriptions: customDescriptions,
      images
    }
  }
  
  // Generic category-based suggestions
  return {
    descriptions: categoryTemplate.descriptions,
    images
  }
}

export async function getDefaultSuggestion(productName: string, category: string): Promise<{
  description: string
  image: string
}> {
  const suggestions = await generateProductSuggestions(productName, category)
  return {
    description: suggestions.descriptions[0],
    image: suggestions.images[0]
  }
}
