
import { Gender, RatingResult } from '@/context/RatingContext';

// This is a mock service that simulates AI ratings
// In a real application, this would be replaced with actual AI analysis

const maleScoreFeedback = [
  {
    score: 8,
    feedback: "Your outfit shows a great understanding of proportions and fit. The color palette is cohesive and appropriate for the occasion.",
    suggestions: [
      "Consider a slightly slimmer cut for the pants to create a more streamlined silhouette.",
      "A minimalist watch or bracelet would add a touch of sophistication to this look.",
      "Try experimenting with textured fabrics to add depth to your outfit."
    ]
  },
  {
    score: 6,
    feedback: "You've made some good choices with color coordination, but the overall fit could use some refinement. The outfit has potential but lacks cohesion.",
    suggestions: [
      "Choose clothes that better fit your body type - the shoulders appear too wide.",
      "Consider hemming your pants to avoid bunching at the ankles.",
      "Add a belt to create more structure in your silhouette."
    ]
  },
  {
    score: 9,
    feedback: "Excellent style choices! Your outfit demonstrates a strong understanding of current trends while maintaining a classic appeal. The fit is nearly perfect.",
    suggestions: [
      "A pocket square would elevate this formal look even further.",
      "Consider slightly shorter sleeves to show a quarter-inch of shirt cuff."
    ]
  },
  {
    score: 7,
    feedback: "Good casual outfit with nice color coordination. The fit is generally good but could be more tailored to your body shape.",
    suggestions: [
      "Try shirts with a slightly more tapered waist to avoid the billowing effect.",
      "Cuff your jeans for a more intentional casual look.",
      "Consider shoes that complement your outfit's color palette better."
    ]
  }
];

const femaleScoreFeedback = [
  {
    score: 8,
    feedback: "Your outfit demonstrates a great eye for proportion and balance. The color choices complement your complexion well, and the overall look is polished.",
    suggestions: [
      "Consider adding a statement accessory like earrings or a necklace to elevate the look.",
      "A slight adjustment in sleeve length would create more flattering proportions.",
      "Try adding one contrasting color piece to create more visual interest."
    ]
  },
  {
    score: 7,
    feedback: "Good style choices with a nice balance of colors. The silhouette is flattering, though there's room for improvement in accessorizing.",
    suggestions: [
      "A belt would help define your waistline and add structure to this outfit.",
      "Consider layering with a light jacket or cardigan for more dimension.",
      "Shoes in a complementary color would help tie the whole look together."
    ]
  },
  {
    score: 9,
    feedback: "Exceptional outfit! Your clothing choices perfectly highlight your figure, and the color coordination is sophisticated and intentional.",
    suggestions: [
      "A delicate bracelet or watch would complete this already stellar look.",
      "Consider a slightly different neckline to better complement your face shape."
    ]
  },
  {
    score: 6,
    feedback: "Your color choices work well together, but the proportions could be more flattering. The outfit has potential but needs some refinement.",
    suggestions: [
      "Opt for higher-waisted bottoms to create a more balanced silhouette.",
      "Consider the 'front tuck' technique with your top to add structure.",
      "A different shoe style would better complement this outfit's aesthetic."
    ]
  }
];

const getRandomIndex = (array: any[]) => {
  return Math.floor(Math.random() * array.length);
};

export const analyzeOutfit = (gender: Gender): Promise<RatingResult> => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      const feedbackArray = gender === 'male' ? maleScoreFeedback : femaleScoreFeedback;
      const randomFeedback = feedbackArray[getRandomIndex(feedbackArray)];
      resolve(randomFeedback);
    }, 2000); // 2 second delay to simulate processing
  });
};
