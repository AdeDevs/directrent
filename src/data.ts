import { Listing } from './types';

export const FEATURED_LISTINGS: Listing[] = [
  {
    id: 'f1',
    title: 'Modern Studio Apartment',
    price: '₦850,000 / year',
    priceValue: 850000,
    location: 'Yaba, Lagos',
    type: 'Studio',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    verified: true,
    noFee: true,
    beds: 1,
    baths: 1,
    amenities: ['Stable Power', 'Water', 'Security'],
    description: 'A clean and modern studio apartment in the heart of Yaba, perfect for students and young professionals.',
    agent: {
      name: 'Kunle Properties',
      rating: 4.8,
      isVerified: true
    }
  },
  {
    id: 'f2',
    title: 'Luxury 1 Bedroom Flat',
    price: '₦1,200,000 / year',
    priceValue: 1200000,
    location: 'Bodija, Ibadan',
    type: '1 Bedroom Flat',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    verified: true,
    noFee: false,
    beds: 1,
    baths: 1,
    amenities: ['Fenced', 'Parking Slot', 'Quiet Neighborhood'],
    description: 'Spacious 1 bedroom flat located in the serene environment of Bodija. Close to major transit routes.',
    agent: {
      name: 'Sarah Real Estate',
      rating: 4.9,
      isVerified: true
    }
  },
  {
    id: 'f3',
    title: 'Executive Self-Contain',
    price: '₦600,000 / year',
    priceValue: 600000,
    location: 'Gwarinpa, Abuja',
    type: 'Self-contain',
    image: 'https://images.unsplash.com/photo-1536376074432-bf121770998a?auto=format&fit=crop&w=800&q=80',
    verified: true,
    noFee: true,
    beds: 1,
    baths: 1,
    amenities: ['Gated Estate', 'Clean Water', 'Greenery'],
    description: 'Affordable and well-maintained self-contain in a high-security estate in Gwarinpa.',
    agent: {
      name: 'Moses & Partners',
      rating: 4.7,
      isVerified: true
    }
  }
];
