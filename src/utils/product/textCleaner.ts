
export const cleanProductName = (text: string): string => {
  return text
    .replace(/\b(?:the|a|an|some|any|your|my|his|her|their|this|that|these|those)\b/gi, '')
    .replace(/\b(?:very|really|quite|pretty|so|too|more|most|less|least|such)\b/gi, '')
    .replace(/\b(?:colored?|toned?|style|styled|looking|type|kind)\b/gi, '')
    .replace(/\b(?:would|could|might|will|can|should|may)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};
