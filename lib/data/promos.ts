import { Promo } from '../types';

export const promos: Promo[] = [
  {
    id: 'promo-1',
    titleId: 'Early Bird 20% - Apartemen Rasuna',
    titleEn: 'Early Bird 20% - Rasuna Apartments',
    descriptionId: 'Dapatkan diskon 20% untuk pemesanan lebih dari 2 malam di RF Rasuna 1 & 2. Berlaku hingga akhir bulan ini!',
    descriptionEn: 'Get 20% discount for bookings of more than 2 nights at RF Rasuna 1 & 2. Valid until end of this month!',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    validUntil: '2024-12-31',
    active: true
  },
  {
    id: 'promo-2',
    titleId: 'Group Special - Rombongan 25+ Orang',
    titleEn: 'Group Special - 25+ People Groups',
    descriptionId: 'Khusus rombongan 25+ orang, dapatkan harga spesial dan layanan tambahan gratis untuk RF 3 & RF 4!',
    descriptionEn: 'Special pricing for groups of 25+ people with free additional services at RF 3 & RF 4!',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    validUntil: '2024-12-31',
    active: true
  },
  {
    id: 'promo-3',
    titleId: 'Winter Staycation - Hotel Special',
    titleEn: 'Winter Staycation - Hotel Special',
    descriptionId: '[DUMMY] Paket spesial musim dingin untuk staycation keluarga. Nikmati suasana nyaman dengan konsep syariah.',
    descriptionEn: '[DUMMY] Special winter package for family staycation. Enjoy a comfortable atmosphere with Sharia concept.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    validUntil: '2024-12-15',
    active: false
  }
];
