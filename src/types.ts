export interface Listing {
  id: string | number;
  title: string;
  price: string;
  priceValue: number;
  location: string;
  type: string;
  image: string;
  verified: boolean;
  isApproved?: boolean;
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
    avatarUrl?: string;
  };
  isFavorite?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type ViewState = 'landing' | 'auth' | 'app';
export type AppTab = 'home' | 'chat' | 'profile' | 'favorites' | 'create' | 'mylistings' | 'notifications';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'verification' | 'listing' | 'system';
  read: boolean;
  createdAt: any;
  link?: string;
  relatedId?: string;
}
export type AuthMode = 'login' | 'signup';
export type UserRole = 'tenant' | 'agent';

export type VerificationLevel = 'none' | 'verified';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  nin: string;
  city: string;
  role: UserRole;
  gender?: string;
  age?: string;
  country: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  verificationLevel?: VerificationLevel;
  govtIdUrl?: string;
  govtIdType?: 'NIN Slip' | 'National ID Card' | 'Drivers License' | 'Passport';
  selfieUrl?: string;
  verificationStatus?: 'none' | 'pending' | 'verified';
  about?: string;
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
