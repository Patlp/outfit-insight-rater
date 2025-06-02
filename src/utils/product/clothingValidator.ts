
export const isValidClothingItem = (item: string): boolean => {
  // Comprehensive clothing keywords organized by category
  const clothingKeywords = [
    // Footwear
    'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'heel', 'heels', 
    'flat', 'flats', 'sandal', 'sandals', 'pump', 'pumps', 'loafer', 'loafers',
    'oxford', 'oxfords', 'derby', 'chelsea', 'ankle boot', 'combat boot', 'running shoe',
    
    // Tops
    'shirt', 'shirts', 'blouse', 'blouses', 'top', 'tops', 'tee', 'tees', 't-shirt',
    'sweater', 'sweaters', 'cardigan', 'cardigans', 'hoodie', 'hoodies', 'pullover',
    'tank', 'tanks', 'camisole', 'polo', 'henley', 'button-down', 'button down',
    'jersey', 'tunic', 'crop top', 'tube top',
    
    // Bottoms
    'pants', 'pant', 'jean', 'jeans', 'trouser', 'trousers', 'skirt', 'skirts',
    'short', 'shorts', 'legging', 'leggings', 'jogger', 'joggers', 'chino', 'chinos',
    'slacks', 'capri', 'palazzo', 'wide leg', 'skinny', 'straight leg', 'bootcut',
    
    // Dresses & One-pieces
    'dress', 'dresses', 'gown', 'gowns', 'frock', 'midi dress', 'maxi dress',
    'mini dress', 'cocktail dress', 'sundress', 'wrap dress', 'shift dress',
    'jumpsuit', 'romper', 'playsuit', 'overall', 'overalls',
    
    // Outerwear
    'jacket', 'jackets', 'blazer', 'blazers', 'coat', 'coats', 'vest', 'vests',
    'windbreaker', 'puffer', 'bomber', 'denim jacket', 'leather jacket',
    'trench coat', 'peacoat', 'raincoat', 'parka', 'cardigan coat',
    
    // Accessories
    'necklace', 'necklaces', 'bracelet', 'bracelets', 'watch', 'watches',
    'belt', 'belts', 'bag', 'bags', 'purse', 'purses', 'earring', 'earrings',
    'scarf', 'scarves', 'hat', 'hats', 'cap', 'caps', 'sunglasses', 'glasses',
    'ring', 'rings', 'chain', 'chains', 'pendant', 'brooch', 'pin',
    'backpack', 'tote', 'clutch', 'crossbody', 'messenger bag', 'handbag',
    
    // Undergarments & basics
    'sock', 'socks', 'stocking', 'stockings', 'tights', 'pantyhose', 'hosiery'
  ];
  
  // Enhanced exclusion list
  const excludeWords = [
    'color', 'colors', 'tone', 'tones', 'shade', 'shades', 'fabric', 'fabrics',
    'material', 'materials', 'texture', 'textures', 'pattern', 'patterns',
    'style', 'styles', 'look', 'looks', 'feel', 'feels', 'fit', 'fits',
    'size', 'sizes', 'length', 'lengths', 'cut', 'cuts', 'design', 'designs',
    'wash', 'washes', 'finish', 'finishes', 'detail', 'details', 'piece', 'pieces',
    'item', 'items', 'thing', 'things', 'something', 'anything', 'everything',
    'outfit', 'outfits', 'ensemble', 'wardrobe', 'clothing', 'clothes',
    'cotton', 'wool', 'silk', 'linen', 'polyester', 'denim', 'leather',
    'light', 'dark', 'bright', 'soft', 'bold', 'neutral', 'warm', 'cool',
    'casual', 'formal', 'dressy', 'professional', 'smart', 'elegant'
  ];
  
  const words = item.toLowerCase().split(' ');
  const itemLower = item.toLowerCase();
  
  // Skip if it's only excluded words
  if (words.every(word => excludeWords.includes(word))) {
    console.log('Item contains only excluded words:', item);
    return false;
  }
  
  // Check for clothing keywords with improved matching
  const hasClothingKeyword = clothingKeywords.some(keyword => {
    // Exact match or contains keyword
    if (itemLower === keyword || itemLower.includes(keyword) || keyword.includes(itemLower)) {
      return true;
    }
    
    // Check individual words
    return words.some(word => {
      return word === keyword || word.includes(keyword) || keyword.includes(word);
    });
  });
  
  console.log(`Clothing validation for "${item}":`, hasClothingKeyword);
  return hasClothingKeyword;
};
