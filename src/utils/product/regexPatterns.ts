
export const getActionPatterns = (): RegExp[] => {
  return [
    // Direct action patterns: "try a white cardigan", "add dark jeans"
    /(?:try|add|wear|choose|opt for|consider|include|incorporate|get)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:that|which|to|for|instead|would|could|might)|\.|,|;|$)/gi,
    
    // Replacement patterns: "swap for sandals", "replace with blazer"
    /(?:swap|replace|substitute|change)(?:\s+(?:the|your|this|it))?\s+(?:for|with|to)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:that|which|to|for|would|could)|\.|,|;|$)/gi,
    
    // Pairing patterns: "pair with black boots", "match with cardigan"
    /(?:pair|match|combine|go)\s+(?:with|alongside)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:that|which|to|for)|\.|,|;|$)/gi,
    
    // Suggestion patterns: "cardigan would help", "blazer could work"
    /(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)\s+(?:would|could|might|will|can)\s+(?:help|improve|enhance|add|complement|work|look|be|provide)/gi,
    
    // Color/style modification: "lighter cardigan", "darker jeans", "fitted top"
    /(?:lighter|darker|brighter|softer|bolder|fitted|loose|structured|tailored|casual|formal)\s+(?:colored?)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:would|could|might)|\.|,|;|$)/gi,
    
    // Direct clothing mentions: "white sneakers", "black blazer"
    /\b(?:white|black|blue|red|green|yellow|pink|purple|brown|gray|grey|navy|beige|cream|tan)\s+([a-zA-Z\s-]{3,40}?)(?:\s+(?:would|could|might|that|which)|\.|,|;|$)/gi,
    
    // Material-based: "leather jacket", "denim shirt", "cotton cardigan"
    /\b(?:leather|denim|cotton|wool|silk|linen|knit|velvet|cashmere)\s+([a-zA-Z\s-]{3,40}?)(?:\s+(?:would|could|might|that|which)|\.|,|;|$)/gi,
  ];
};
