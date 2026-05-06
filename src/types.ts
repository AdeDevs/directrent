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
  status?: 'active' | 'pending' | 'rejected' | 'hidden';
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
  coordinates?: [number, number];
  latitude?: number;
  longitude?: number;
  placeId?: string;
  createdAt?: any;
  updatedAt?: any;
  viewCount?: number;
  favoritesCount?: number;
  inquiryCount?: number;
}

export type ViewState = 'landing' | 'auth' | 'app' | 'admin' | 'admin-auth';
export type AppTab = 'home' | 'chat' | 'profile' | 'favorites' | 'create' | 'mylistings' | 'notifications' | 'terms' | 'faq';

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
export type UserRole = 'tenant' | 'agent' | 'admin' | 'moderator';

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
  name: string;
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
  adminTier?: 'Moderator' | 'Super Admin';
  internalPhone?: string;
  createdAt?: string;
  updatedAt?: string;
  about?: string;
  theme?: 'light' | 'dark';
  listingsCount?: number;
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

export interface Verification {
  id: string;
  userId: string;
  name: string;
  idType: string;
  idNumber?: string;
  role?: string;
  location?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  updatedAt?: any;
}
