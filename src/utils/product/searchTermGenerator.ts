
import { Gender } from '@/context/RatingContext';

// Gender-specific search modifiers
const GENDER_MODIFIERS: Record<Gender, string> = {
  'male': 'mens',
  'female': 'womens'
};

export const createGenderSpecificSearchTerm = (productTerm: string, gender: Gender): string => {
  const genderModifier = GENDER_MODIFIERS[gender];
  return `${genderModifier} ${productTerm}`;
};
