export type Category = 'Chat AI' | 'Image Generation' | 'Video AI' | 'Coding AI' | 'Voice AI' | 'Productivity AI' | 'Marketing AI' | 'Design AI' | 'Writing AI' | 'Data AI' | 'Music AI' | 'Education AI';
export type Pricing = 'Free' | 'Freemium' | 'Paid';
export type SortOption = 'Most Popular' | 'Highest Rated' | 'Newest' | 'Free First';

export interface AITool {
  id: string;
  name: string;
  description: string;
  category: Category;
  pricing: Pricing;
  pricingDetails?: string;
  url: string;
  logo: string;
  features?: string[];
  pros?: string[];
  cons?: string[];
  useCases?: string[];
  rating: number;
  reviewCount: number;
  popularity: number;
  addedDate: string;
  videoUrl?: string;
  isVerified?: boolean;
  hasDeals?: boolean;
  tags?: string[];
}

export interface Review {
  id: string;
  toolId: string;
  rating: number;
  comment: string;
  userName: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'user' | 'admin';
}

export interface UserData {
  user: User | null;
  favorites: string[];
  ratings: Record<string, number>;
  reviews: Review[];
  submittedTools: string[];
}
