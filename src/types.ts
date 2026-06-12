export interface Listing {
  id: string | number;
  title: string;
  price: string;
  priceValue: number;
  paymentPeriod?: 'monthly' | 'quarterly' | 'bi-annually' | 'annually' | 'custom';
  leaseDuration?: string;
  initialPayment?: string;
  initialPaymentValue?: number;
  subsequentPayment?: string;
  subsequentPaymentValue?: number;
  location: string;
  type: string;
  image: string;
  verified: boolean;
  isApproved?: boolean;
  status?: 'active' | 'pending' | 'rejected' | 'hidden' | 'suspended' | 'completed' | 'ACTIVE';
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
    userId?: string;
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

export type ViewState = 'landing' | 'auth' | 'app' | 'admin' | 'admin-auth' | 'legal';
export type AppTab = 'home' | 'chat' | 'profile' | 'favorites' | 'create' | 'mylistings' | 'notifications' | 'terms' | 'faq' | 'wallet';

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

export type VerificationLevel = 'none' | 'trusted' | 'verified';

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
  dob?: string;
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
  hasPassword?: boolean;
  completedTxns?: number;
  userVerificationReason?: string | null;
  bankAccounts?: Array<{
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }>;
  agent?: {
    verificationReason?: string | null;
    isVerified?: boolean;
  };
}

export type ConversationStatus = 'inquiry' | 'tour_requested' | 'tour_confirmed' | 'contract_sent' | 'escrow_locked' | 'disputed' | 'completed';

export type EscrowStatus = 'locked' | 'released' | 'refunded' | 'disputed';

export interface Transaction {
  id: string;
  reference: string;
  listingId: string;
  propertyTitle: string;
  rentAmount: number;
  platformFee: number;
  gatewayFee: number;
  totalPaid: number;
  tenantId: string;
  tenantName: string;
  agentId: string;
  agentName: string;
  date: any;
  status: 'locked' | 'released' | 'refunded' | 'disputed';
  escrowDeadline?: any;
}


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
  tenantAvatarUrl?: string;
}

export interface Verification {
  id: string;
  userId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  idType: string;
  idNumber?: string;
  role?: string;
  location?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  updatedAt?: any;
  createdAt?: any;
  rejectionReason?: string;
}

export type MessageType = 'text' | 'action' | 'audio' | 'document';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  tenantId: string;
  agentId: string;
  type?: MessageType;
  duration?: number;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  actionType?: string;
  createdAt: any;
}
