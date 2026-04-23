export interface Listing {
  id: number;
  title: string;
  price: string;
  priceValue: number;
  location: string;
  type: string;
  image: string;
  verified: boolean;
  noFee: boolean;
  beds?: number;
  baths?: number;
  area?: string;
  amenities: string[];
  landmark?: string;
  description?: string;
  images?: string[];
  video?: string;
  isRecentlyAdded?: boolean;
  slotsLeft?: number;
  agent?: {
    id?: string;
    name: string;
    rating: number;
    isVerified: boolean;
  };
  isFavorite?: boolean;
}

export type ViewState = 'landing' | 'auth' | 'app';
export type AppTab = 'home' | 'chat' | 'profile' | 'favorites';
export type AuthMode = 'login' | 'signup';
export type UserRole = 'tenant' | 'agent';

export type VerificationLevel = 'Unverified' | 'Verified' | 'Trusted' | 'Fully Verified';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  nin: string;
  city: string;
  gender?: string;
  age?: string;
  country: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  verificationLevel?: VerificationLevel;
}

export type ConversationStatus = 'inquiry' | 'negotiating' | 'contract_requested' | 'contract_sent' | 'paid' | 'completed';

export interface Review {
  id: string;
  tenantId: string;
  tenantName: string;
  agentId: string;
  rating: number;
  comment: string;
  listingId: string;
  listingTitle: string;
  createdAt: any;
}
