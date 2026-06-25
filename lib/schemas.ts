// lib/schemas.ts
import { z } from 'zod';

// ===== Room Type Schemas =====
const RoomSchema = z.object({
  id: z.string().optional(),
  roomNumber: z.string().min(1, 'Nomor kamar wajib diisi'),
});

const RoomTypeSchema = z.object({
  id: z.string().optional(),
  nameId: z.string().min(1, 'Nama tipe kamar (ID) wajib diisi'),
  nameEn: z.string().min(1, 'Nama tipe kamar (EN) wajib diisi'),
  capacity: z.number().min(1, 'Kapasitas minimal 1 orang'),
  priceWeekday: z.number().min(0, 'Harga weekday tidak boleh negatif'),
  priceWeekend: z.number().min(0, 'Harga weekend tidak boleh negatif'),
  images: z.array(z.string()).optional(),
  rooms: z.array(RoomSchema).min(1, 'Minimal 1 kamar'),
});

// ===== Property Schemas =====
export const PropertySchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  nameId: z.string().min(1, 'Nama properti (ID) wajib diisi'),
  nameEn: z.string().min(1, 'Nama properti (EN) wajib diisi'),
  type: z.enum(['hotel', 'kos', 'apartemen', 'rumah']),
  locationId: z.string().min(1, 'Lokasi (ID) wajib diisi'),
  locationEn: z.string().min(1, 'Lokasi (EN) wajib diisi'),
  mapsUrl: z.string().optional().nullable(),
  capacity: z.object({
    min: z.number().min(0),
    max: z.number().min(1),
  }),
  pricing: z
    .object({
      weekday: z.number().min(0).optional(),
      weekend: z.number().min(0).optional(),
    })
    .optional(),
  pricingMode: z.enum(['general', 'wni-wna']).optional(),
  monthlyPrice: z.number().min(0).optional(),
  monthlyPricingWNI: z.number().min(0).optional(),
  monthlyPricingWNA: z.number().min(0).optional(),
  extraCharge: z
    .object({
      amount: z.number().min(0),
      unit: z.enum(['per_person', 'per_group']),
    })
    .optional(),
  deposit: z.number().min(0).optional(),
  description: z.string().min(1, 'Deskripsi (ID) wajib diisi'),
  descriptionEn: z.string().min(1, 'Deskripsi (EN) wajib diisi'),
  image: z.string().min(1, 'Gambar wajib diisi'),
  images: z.array(z.string()).optional(),
  facilities: z.array(z.object({
    label: z.string(),
    labelEn: z.string(),
    icon: z.string(),
  })).optional(),
  rules: z.array(z.string()).optional(),
  rulesEn: z.array(z.string()).optional(),
  notes: z.string().optional(),
  notesEn: z.string().optional(),
  isGroupFriendly: z.boolean().optional(),
  minGroupSize: z.number().min(0).optional(),
  // NEW: Room Types (hanya untuk hotel)
  roomTypes: z.array(RoomTypeSchema).optional(),
  // Units (untuk kos, apartemen, rumah)
  units: z
    .array(
      z.object({
        unitId: z.string().optional(),
        unitName: z.string().min(1, 'Nama unit/kamar wajib diisi'),
      })
    )
    .optional(),
  version: z.number().optional(),
});

// ===== Promo Schema =====
export const PromoSchema = z.object({
  id: z.string().optional(),
  titleId: z.string().min(1, 'Judul (ID) wajib diisi'),
  titleEn: z.string().min(1, 'Judul (EN) wajib diisi'),
  descriptionId: z.string().min(1, 'Deskripsi (ID) wajib diisi'),
  descriptionEn: z.string().min(1, 'Deskripsi (EN) wajib diisi'),
  image: z.string().url('URL gambar tidak valid'),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  active: z.boolean(),
  propertyIds: z.array(z.string()).optional(),
  version: z.number().optional(),
});

// ===== FAQ Schema =====
export const FAQSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, 'Kategori (ID) wajib diisi'),
  categoryEn: z.string().min(1, 'Kategori (EN) wajib diisi'),
  questionId: z.string().min(1, 'Pertanyaan (ID) wajib diisi'),
  questionEn: z.string().min(1, 'Pertanyaan (EN) wajib diisi'),
  answerIdContent: z.string().min(1, 'Jawaban (ID) wajib diisi'),
  answerEnContent: z.string().min(1, 'Jawaban (EN) wajib diisi'),
  version: z.number().optional(),
});

// ===== About Schema =====
export const AboutSchema = z.object({
  mission: z.string().optional(),
  missionEn: z.string().optional(),
  ctaTitle: z.string().optional(),
  ctaTitleEn: z.string().optional(),
  ctaDesc: z.string().optional(),
  ctaDescEn: z.string().optional(),
  values: z.array(
    z.object({
      title: z.string().optional(),
      desc: z.string().optional(),
      titleEn: z.string().optional(),
      descEn: z.string().optional(),
    })
  ).optional(),
  whyChooseUs: z.array(
    z.object({
      icon: z.string().optional(),
      titleId: z.string().optional(),
      titleEn: z.string().optional(),
      descId: z.string().optional(),
      descEn: z.string().optional(),
    })
  ).optional(),
  version: z.number().optional(),
});

// ===== Home Schema =====
export const HomeSchema = z.object({
  hero: z.object({
    titleId: z.string().optional(),
    titleEn: z.string().optional(),
    subtitleId: z.string().optional(),
    subtitleEn: z.string().optional(),
    ctaPrimaryId: z.string().optional(),
    ctaPrimaryEn: z.string().optional(),
    ctaSecondaryId: z.string().optional(),
    ctaSecondaryEn: z.string().optional(),
    image: z.string().url('URL gambar tidak valid').optional(),
  }).optional(),
  propertyTypes: z.array(
    z.object({
      icon: z.string().optional(),
      labelId: z.string().optional(),
      labelEn: z.string().optional(),
    })
  ).optional(),
  whyUs: z.array(
    z.object({
      icon: z.string().optional(),
      titleId: z.string().optional(),
      titleEn: z.string().optional(),
      descId: z.string().optional(),
      descEn: z.string().optional(),
    })
  ).optional(),
  reviews: z.array(
    z.object({
      name: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      textId: z.string().optional(),
      textEn: z.string().optional(),
    })
  ).optional(),
  version: z.number().optional(),
});

// ===== Site Schema =====
export const SiteSchema = z.object({
  siteName: z.string().optional(),
  logoText: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Email tidak valid').optional(),
  instagramUrl: z.string().url('URL Instagram tidak valid').optional(),
  footerTagline: z.string().optional(),
  copyrightText: z.string().optional(),
  navLinks: z.array(
    z.object({
      label: z.string().optional(),
      href: z.string().optional(),
    })
  ).optional(),
  version: z.number().optional(),
});

// ===== Appearance Schema =====
export const AppearanceSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format warna tidak valid'),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format warna tidak valid'),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format warna tidak valid'),
  version: z.number().optional(),
});

// ===== Availability Booking Schema =====
export const AvailabilityBookingSchema = z.object({
  action: z.enum(['addBooking', 'addBookingDates', 'deleteBooking', 'addUnit', 'deleteUnit']),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  roomTypeId: z.string().optional(), // NEW: untuk hotel
  roomId: z.string().optional(), // NEW: untuk hotel
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')).optional(),
  note: z.string().optional(),
  bookingId: z.string().optional(),
  unitName: z.string().optional(),
});