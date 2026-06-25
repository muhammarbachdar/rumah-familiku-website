// lib/types.ts

export interface Booking {
  id: string;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD, eksklusif
  note?: string;
}

export interface PropertyAvailability {
  mode: 'property' | 'unit';
  bookings?: Booking[]; // jika mode === 'property'
  units?: {
    unitId: string;
    unitName: string;
    bookings: Booking[];
  }[]; // jika mode === 'unit' (untuk Kos, Apartemen, Rumah)
  // NEW: untuk Hotel dengan roomTypes
  roomTypes?: {
    roomTypeId: string;
    roomTypeName: string;
    rooms: {
      roomId: string;
      roomNumber: string;
      bookings: Booking[];
    }[];
  }[];
}

export interface PropertyUnit {
  unitId: string;
  unitName: string;
}

// NEW: Room Type untuk Hotel
export interface RoomType {
  id: string;
  nameId: string;
  nameEn: string;
  capacity: number;
  price: number; // harga per malam untuk tipe kamar ini
  image?: string;
  rooms: Room[];
}

export interface Room {
  id: string;
  roomNumber: string; // internal admin only, tidak ditampilkan ke user
}

// Update interface Property
export interface Property {
  id: string;
  slug: string;
  nameId: string;
  nameEn: string;
  type: 'hotel' | 'kos' | 'apartemen' | 'rumah';
  locationId: string;
  locationEn: string;
  capacity: {
    min: number;
    max: number;
  };
  pricing?: {
    weekday: number;
    weekend: number;
  };
  // Mode harga untuk properti tipe Kos
  pricingMode?: 'general' | 'wni-wna';
  // Harga tunggal untuk mode general
  monthlyPrice?: number;
  // Harga untuk mode wni-wna
  monthlyPricingWNI?: number;
  monthlyPricingWNA?: number;
  extraCharge?: {
    amount: number;
    unit: 'per_person' | 'per_group';
    upToCapacity?: number;
  };
  deposit?: number;
  facilities?: { label: string; labelEn: string; icon: string }[];
  description: string;
  descriptionEn: string;
  rules: string[];
  rulesEn: string[];
  image: string;
  images?: string[];
  notes?: string;
  notesEn?: string;
  isGroupFriendly?: boolean;
  minGroupSize?: number;
  // NEW: Availability fields
  units?: PropertyUnit[]; // untuk Kos, Apartemen, Rumah (flat)
  // NEW: Room Types untuk Hotel
  roomTypes?: RoomType[];
  // NEW: Version for optimistic locking
  version?: number;
}

export interface Promo {
  id: string;
  titleId: string;
  titleEn: string;
  descriptionId: string;
  descriptionEn: string;
  image: string;
  validUntil: string;
  active: boolean;
  propertyIds?: string[];
  // NEW: Version for optimistic locking
  version?: number;
}

export interface FAQ {
  id: string;
  categoryId: string;
  categoryEn: string;
  questionId: string;
  questionEn: string;
  answerIdContent: string;
  answerEnContent: string;
  // NEW: Version for optimistic locking
  version?: number;
}

export interface AboutContent {
  mission: string;
  missionEn: string;
  ctaTitle: string;
  ctaTitleEn: string;
  ctaDesc: string;
  ctaDescEn: string;
  values: { title: string; desc: string; titleEn: string; descEn: string }[];
  whyChooseUs: { icon: string; titleId: string; titleEn: string; descId: string; descEn: string }[];
  version?: number;
}

export interface HomeContent {
  hero: {
    titleId: string;
    titleEn: string;
    subtitleId: string;
    subtitleEn: string;
    ctaPrimaryId: string;
    ctaPrimaryEn: string;
    ctaSecondaryId: string;
    ctaSecondaryEn: string;
    image: string;
  };
  propertyTypes: { icon: string; labelId: string; labelEn: string }[];
  whyUs: { icon: string; titleId: string; titleEn: string; descId: string; descEn: string }[];
  reviews: { name: string; rating: number; textId: string; textEn: string }[];
  version?: number;
}

export interface SiteContent {
  siteName: string;
  logoText: string;
  whatsappNumber: string;
  email: string;
  instagramUrl: string;
  footerTagline: string;
  copyrightText: string;
  navLinks: { label: string; href: string }[];
  version?: number;
}

export interface AppearanceContent {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  version?: number;
}