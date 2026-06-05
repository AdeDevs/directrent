import { Listing } from './types';

export const FEATURED_LISTINGS: Listing[] = [
  {
    id: 'demo1',
    title: 'Modern 3-Bedroom Flat',
    price: '₦700,000',
    priceValue: 700000,
    paymentPeriod: 'annually',
    location: 'Bodija, Ibadan',
    type: '1 Bedroom Flat',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    verified: true,
    noFee: true,
    amenities: ['Running Water', 'Security', 'Prepaid Meter', 'Parking'],
    landmark: 'Bodija Plaza',
    description: 'Perfect contemporary 1-bedroom flat located in a very secure pocket of Bodija, Ibadan. Features constant running water, prepaid meter, private security patrol, and secured parking.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ],
    agent: {
      id: 'agent_leon',
      name: 'Leon Atlas',
      rating: 4.9,
      isVerified: true
    }
  },
  {
    id: 'demo2',
    title: 'Cozy Student Studio Flat',
    price: '₦350,000',
    priceValue: 350000,
    paymentPeriod: 'annually',
    location: 'Under G, Ogbomoso',
    type: 'Self-contain',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop',
    verified: true,
    noFee: true,
    amenities: ['Running Water', 'Prepaid Meter', 'Fenced', 'Solar/Inverter'],
    landmark: 'LAUTECH Back Gate',
    description: 'A cozy studio flat located near LAUTECH at Under G, Ogbomoso. Featuring steady solar inverter systems, complete fencing for student safety, and stable running water.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'
    ],
    agent: {
      id: 'agent_leon',
      name: 'Leon Atlas',
      rating: 4.9,
      isVerified: true
    }
  },
  {
    id: 'demo3',
    title: 'Executive Luxury Penthouse Studio',
    price: '₦950,000',
    priceValue: 950000,
    paymentPeriod: 'annually',
    location: 'Akobo, Ibadan',
    type: 'Studio',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop',
    verified: true,
    noFee: false,
    amenities: ['Running Water', 'Security', 'Prepaid Meter', 'Solar/Inverter', 'AC', 'Swimming Pool', 'Gym'],
    landmark: 'Akobo Police Station',
    description: 'An executive penthouse studio in Akobo with high-end premium features. Swimming pool, private gym access, 24/7 security patrol, clean borehole water, split AC systems, and hybrid solar setup.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
    ],
    agent: {
      id: 'agent_leon',
      name: 'Leon Atlas',
      rating: 4.9,
      isVerified: true
    }
  },
  {
    id: 'demo4',
    title: 'Premium Standard 1 Bedroom Flat',
    price: '₦600,000 / year',
    priceValue: 600000,
    paymentPeriod: 'annually',
    location: 'Samonda, Ibadan',
    type: '1 Bedroom Flat',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    verified: true,
    noFee: true,
    amenities: ['Running Water', 'Security', 'Prepaid Meter', 'Generator'],
    landmark: 'Ventura Mall Samonda',
    description: 'Located central to the Samonda neighborhood. Extremely quick access to UI, standard power backed by estate generator, private gated parking, running water with premium filters, and responsive on-site security.',
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    agent: {
      id: 'agent_peace',
      name: 'Peace Olaoluwa',
      rating: 4.8,
      isVerified: true
    }
  },
  {
    id: 'demo5',
    title: 'Modern Furnished Self-Contain',
    price: '₦300,000 / year',
    priceValue: 300000,
    paymentPeriod: 'annually',
    location: 'Adenike, Ogbomoso',
    type: 'Self-contain',
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
    verified: true,
    noFee: true,
    amenities: ['Running Water', 'Prepaid Meter', 'Fenced', 'Security', 'Parking'],
    landmark: 'Adenike Baptist Academy',
    description: 'A stellar, recently renovated self-contain flat in Adenike, Ogbomoso near school transit center. Offering secure parking, running water, standard prepaid electric meters, secure high fences, and general night watches.',
    images: [
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    agent: {
      id: 'agent_peace',
      name: 'Peace Olaoluwa',
      rating: 4.8,
      isVerified: true
    }
  },
  {
    id: 'demo6',
    title: 'Shared Cozy Student Enclave',
    price: '₦220,000 / year',
    priceValue: 220000,
    paymentPeriod: 'annually',
    location: 'Lautech, Ogbomoso',
    type: 'Shared',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    verified: true,
    noFee: false,
    amenities: ['Running Water', 'Prepaid Meter', 'Security', 'Fenced'],
    landmark: 'LAUTECH Main Campus Gate',
    description: 'A highly functional shared roommate setup right outside LAUTECH campus, Ogbomoso. Comes with a prepaid meter, fenced perimeter, tight security gates, and 24/7 borehole water flow.',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    agent: {
      id: 'agent_peace',
      name: 'Peace Olaoluwa',
      rating: 4.8,
      isVerified: true
    }
  }
];
