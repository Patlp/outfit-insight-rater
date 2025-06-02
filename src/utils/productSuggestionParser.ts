
export interface ProductSuggestion {
  name: string;
  context: string;
  category: string;
}

export const parseProductSuggestions = (feedback: string, suggestions: string[]): ProductSuggestion[] => {
  const productSuggestions: ProductSuggestion[] = [];
  
  // Combine feedback and suggestions for parsing
  const combinedText = `${feedback} ${suggestions.join(' ')}`.toLowerCase();
  
  // Product patterns to look for
  const productPatterns = [
    // Footwear
    { 
      patterns: ['sneakers', 'shoes', 'boots', 'loafers', 'sandals', 'heels'],
      category: 'Footwear',
      contexts: {
        'sneakers': 'These shoes add clean contrast to your outfit',
        'shoes': 'The right shoes can elevate your entire look',
        'boots': 'Boots add structure and style to your outfit',
        'loafers': 'Classic loafers bring sophistication',
        'sandals': 'Perfect for a relaxed, comfortable style',
        'heels': 'Heels add elegance and height to your silhouette'
      }
    },
    // Accessories
    {
      patterns: ['necklace', 'bracelet', 'watch', 'belt', 'bag', 'earrings', 'ring'],
      category: 'Accessories',
      contexts: {
        'necklace': 'A statement necklace draws attention upward',
        'bracelet': 'The right bracelet adds subtle elegance',
        'watch': 'A quality watch shows attention to detail',
        'belt': 'A good belt defines your waistline beautifully',
        'bag': 'The perfect bag completes your look',
        'earrings': 'Statement earrings frame your face nicely',
        'ring': 'Rings add a personal touch to your style'
      }
    },
    // Clothing
    {
      patterns: ['jacket', 'blazer', 'cardigan', 'shirt', 'top', 'dress', 'pants', 'jeans'],
      category: 'Clothing',
      contexts: {
        'jacket': 'A well-fitted jacket instantly polishes any outfit',
        'blazer': 'A blazer adds professional sophistication',
        'cardigan': 'Cardigans provide comfortable layering options',
        'shirt': 'The right shirt is the foundation of great style',
        'top': 'A flattering top enhances your silhouette',
        'dress': 'The perfect dress makes dressing effortless',
        'pants': 'Well-fitted pants are essential for any wardrobe',
        'jeans': 'Quality jeans are a versatile wardrobe staple'
      }
    }
  ];

  // Extract product suggestions from text
  productPatterns.forEach(({ patterns, category, contexts }) => {
    patterns.forEach(pattern => {
      const regex = new RegExp(`\\b(\\w*\\s*${pattern}\\w*)`, 'gi');
      const matches = combinedText.match(regex);
      
      if (matches && productSuggestions.length < 3) {
        // Clean up the match and create a proper product name
        const cleanMatch = matches[0].trim();
        const productName = cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1);
        
        // Avoid duplicates
        if (!productSuggestions.some(p => p.name.toLowerCase().includes(pattern))) {
          productSuggestions.push({
            name: productName,
            context: contexts[pattern] || `This ${pattern} would complement your style perfectly`,
            category
          });
        }
      }
    });
  });

  // If we didn't find enough specific products, add some generic suggestions based on feedback content
  if (productSuggestions.length < 3) {
    const genericSuggestions = [
      {
        name: 'Statement Accessories',
        context: 'The right accessories can transform your entire look',
        category: 'Accessories'
      },
      {
        name: 'Classic White Sneakers',
        context: 'White sneakers are versatile and go with everything',
        category: 'Footwear'
      },
      {
        name: 'Structured Blazer',
        context: 'A well-fitted blazer instantly elevates any outfit',
        category: 'Clothing'
      }
    ];

    // Add generic suggestions to fill up to 3 items
    genericSuggestions.forEach(suggestion => {
      if (productSuggestions.length < 3 && 
          !productSuggestions.some(p => p.name.toLowerCase().includes(suggestion.name.toLowerCase()))) {
        productSuggestions.push(suggestion);
      }
    });
  }

  return productSuggestions.slice(0, 3);
};
