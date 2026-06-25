import { Property } from '../types';


export const properties: Property[] = [
  // HOTEL
  {
    id: 'rf-hotel-1',
    slug: 'rf-hotel-1-syariah',
    nameId: 'RF Hotel 1 Syariah',
    nameEn: 'RF Hotel 1 Sharia',
    type: 'hotel',
    locationId: 'Surabaya (dekat Bandara Juanda)',
    locationEn: 'Surabaya (near Juanda Airport)',
    capacity: { min: 2, max: 4 },
    pricing: { weekday: 350000, weekend: 450000 },
    highlights: [
      'Rooftop terrace',
      'Kolam renang',
      'Parkir 40 mobil',
      'Lobby luas',
      '10 menit dari Bandara Juanda',
      '70 kamar tersedia'
    ],
    highlightsEn: [
      'Rooftop terrace',
      'Swimming pool',
      'Parking for 40 cars',
      'Spacious lobby',
      '10 minutes from Juanda Airport',
      '70 rooms available'
    ],
    description: '[DUMMY] RF Hotel 1 adalah hotel butik dengan konsep syariah yang menghadirkan kenyamanan modern dengan nilai-nilai Islam. Setiap kamar dirancang dengan perhatian terhadap detail dan dilengkapi dengan fasilitas premium.',
    descriptionEn: '[DUMMY] RF Hotel 1 is a boutique hotel with a Sharia concept that brings modern comfort with Islamic values. Each room is designed with attention to detail and equipped with premium facilities.',
    rules: [
      'Wajib buku nikah/KTP alamat sama untuk pasangan',
      'Dilarang merokok di kamar',
      'Dilarang minuman keras',
      'Check-in: 14:00, Check-out: 12:00'
    ],
    rulesEn: [
      'Marriage certificate/ID with same address required for couples',
      'No smoking in rooms',
      'No alcoholic beverages',
      'Check-in: 14:00, Check-out: 12:00'
    ],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'
    ]
  },

  // KOS
  {
    id: 'kos-rf',
    slug: 'kos-rumah-familiku',
    nameId: 'Kos Rumah Familiku Syariah',
    nameEn: 'Kos Rumah Familiku Sharia',
    type: 'kos',
    locationId: 'Surabaya (lantai tersendiri)',
    locationEn: 'Surabaya (separate floor)',
    capacity: { min: 1, max: 1 },
    monthlyPricingWNI: 2900000,
    monthlyPricingWNA: 3500000,
    extraCharge: { amount: 500000, unit: 'per_person' },
    deposit: 1500000,
    highlights: [
      '1 bed untuk 1 orang',
      'Ruang bersama',
      'WiFi gratis',
      'Keamanan 24 jam',
      'Dekat dengan mall & pusat bisnis'
    ],
    highlightsEn: [
      '1 bed per person',
      'Common areas',
      'Free WiFi',
      '24-hour security',
      'Close to malls & business centers'
    ],
    description: '[DUMMY] Kos dengan standar keamanan dan kenyamanan tinggi, ideal untuk karyawan atau mahasiswa yang mencari hunian dengan konsep keluarga besar yang aman dan syariah.',
    descriptionEn: '[DUMMY] Boarding house with high safety and comfort standards, ideal for employees or students looking for Sharia-compliant family-oriented accommodation.',
    rules: [
      'Hanya untuk tamu single atau teman 1 gender',
      'Tidak boleh membawa lawan jenis ke kamar',
      'Dilarang merokok & minuman keras',
      'Jam istirahat: 22:00 - 08:00'
    ],
    rulesEn: [
      'For single guests or same-gender friends only',
      'Cannot bring opposite gender to rooms',
      'No smoking & alcoholic beverages',
      'Rest hours: 22:00 - 08:00'
    ],
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    notes: 'Tidak termasuk: listrik, parkir mobil. Termasuk: AC, WiFi, air panas',
    notesEn: 'Excludes: electricity, car parking. Includes: AC, WiFi, hot water'
  },

  // APARTEMEN - RF RASUNA 1
  {
    id: 'rf-rasuna-1',
    slug: 'rf-rasuna-1-syariah',
    nameId: 'RF Rasuna 1 Syariah',
    nameEn: 'RF Rasuna 1 Sharia',
    type: 'apartemen',
    locationId: 'Jakarta (Rasuna Said, lantai rendah)',
    locationEn: 'Jakarta (Rasuna Said, low floor)',
    capacity: { min: 4, max: 8 },
    pricing: { weekday: 1200000, weekend: 1500000 },
    highlights: [
      'Pemandangan taman',
      'Cocok keluarga dengan anak kecil/lansia',
      'Dapur lengkap',
      'Kolam renang & gym',
      'Dekat Plaza Festival & Mal Epiwalk',
      'Family Mart'
    ],
    highlightsEn: [
      'Garden view',
      'Great for families with small children/elderly',
      'Full kitchen',
      'Swimming pool & gym',
      'Close to Plaza Festival & Mal Epiwalk',
      'Near Family Mart'
    ],
    description: '[DUMMY] Apartemen 3 kamar yang nyaman dan luas, dilengkapi dengan dapur modern dan pemandangan taman yang menenangkan. Cocok untuk keluarga yang mencari suasana tenang namun tetap dekat dengan pusat kota.',
    descriptionEn: '[DUMMY] Spacious 3-bedroom apartment equipped with modern kitchen and calming garden views. Perfect for families seeking a peaceful atmosphere while staying close to the city center.',
    rules: [
      'Keluarga/rombongan keluarga',
      'Check-in: 14:00, Check-out: 12:00',
      'Pembayaran deposit untuk keamanan',
      'Pelaporan tamu tambahan'
    ],
    rulesEn: [
      'Families/family groups',
      'Check-in: 14:00, Check-out: 12:00',
      'Deposit required for security',
      'Reporting additional guests'
    ],
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    deposit: 500000
  },

  // APARTEMEN - RF RASUNA 2
  {
    id: 'rf-rasuna-2',
    slug: 'rf-rasuna-2-syariah',
    nameId: 'RF Rasuna 2 Syariah',
    nameEn: 'RF Rasuna 2 Sharia',
    type: 'apartemen',
    locationId: 'Jakarta (Rasuna Said, view kota)',
    locationEn: 'Jakarta (Rasuna Said, city view)',
    capacity: { min: 4, max: 8 },
    pricing: { weekday: 1300000, weekend: 1600000 },
    highlights: [
      'View kota dari balkon',
      'Dapur lengkap',
      'Kolam renang & gym',
      'Dekat Plaza Festival & Mal Epiwalk',
      'Family Mart',
      '3 balkon besar'
    ],
    highlightsEn: [
      'City view from balcony',
      'Full kitchen',
      'Swimming pool & gym',
      'Close to Plaza Festival & Mal Epiwalk',
      'Near Family Mart',
      '3 large balconies'
    ],
    description: '[DUMMY] Apartemen premium dengan pemandangan kota yang spektakuler dari balkon pribadi. Ideal untuk rombongan atau keluarga besar yang menginginkan kenyamanan maksimal.',
    descriptionEn: '[DUMMY] Premium apartment with spectacular city views from private balcony. Ideal for groups or large families seeking maximum comfort.',
    rules: [
      'Keluarga/rombongan keluarga',
      'Check-in: 14:00, Check-out: 12:00',
      'Pembayaran deposit untuk keamanan',
      'Pelaporan tamu tambahan'
    ],
    rulesEn: [
      'Families/family groups',
      'Check-in: 14:00, Check-out: 12:00',
      'Deposit required for security',
      'Reporting additional guests'
    ],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    deposit: 500000
  },

  // APARTEMEN - RF CEMPAKA
  {
    id: 'rf-cempaka',
    slug: 'rf-cempaka-syariah',
    nameId: 'RF Cempaka Syariah',
    nameEn: 'RF Cempaka Sharia',
    type: 'apartemen',
    locationId: 'Jakarta (Cempaka Mas)',
    locationEn: 'Jakarta (Cempaka Mas)',
    capacity: { min: 4, max: 8 },
    pricing: { weekday: 1100000, weekend: 1400000 },
    highlights: [
      'Dekat terminal busway',
      'ITC Cempaka Mas',
      '3 balkon',
      '4 kamar mandi',
      'Smart TV',
      'WiFi & mesin cuci',
      'Family Mart & Indomaret'
    ],
    highlightsEn: [
      'Close to busway terminal',
      'ITC Cempaka Mas',
      '3 balconies',
      '4 bathrooms',
      'Smart TV',
      'WiFi & washing machine',
      'Family Mart & Indomaret nearby'
    ],
    description: '[DUMMY] Apartemen strategis dengan akses mudah ke transportasi umum dan pusat perbelanjaan. Sempurna untuk rombongan bisnis atau keluarga yang membutuhkan lokasi sentral.',
    descriptionEn: '[DUMMY] Strategic apartment with easy access to public transportation and shopping centers. Perfect for business groups or families needing a central location.',
    rules: [
      'Keluarga/rombongan keluarga',
      'Check-in: 14:00, Check-out: 12:00',
      'Pembayaran deposit untuk keamanan',
      'Pelaporan tamu tambahan'
    ],
    rulesEn: [
      'Families/family groups',
      'Check-in: 14:00, Check-out: 12:00',
      'Deposit required for security',
      'Reporting additional guests'
    ],
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    deposit: 500000
  },

  // RUMAH/VILLA - RF 2
  {
    id: 'rf-2',
    slug: 'rf-2-syariah',
    nameId: 'RF 2 Syariah',
    nameEn: 'RF 2 Sharia',
    type: 'rumah',
    locationId: 'Jakarta (dekat Mal Kota Kasablanka)',
    locationEn: 'Jakarta (near Mal Kota Kasablanka)',
    capacity: { min: 16, max: 25 },
    pricing: { weekday: 3500000, weekend: 4500000 },
    extraCharge: { amount: 60000, unit: 'per_person', upToCapacity: 25 },
    deposit: 500000,
    isGroupFriendly: true,
    minGroupSize: 16,
    highlights: [
      'King Koil beds',
      'Rooftop',
      'Parkir 6 dalam + 2 luar',
      'Bisa parkir bis',
      'Mesin cuci & dryer',
      'Ruang keluarga luas'
    ],
    highlightsEn: [
      'King Koil beds',
      'Rooftop',
      'Parking for 6 inside + 2 outside',
      'Can accommodate buses',
      'Washing machine & dryer',
      'Spacious living area'
    ],
    description: '[DUMMY] Villa mewah yang cocok untuk rombongan keluarga besar, acara keluarga, atau gathering korporat. Dilengkapi dengan fasilitas lengkap dan kenyamanan maksimal.',
    descriptionEn: '[DUMMY] Luxury villa perfect for large family gatherings, family events, or corporate gatherings. Equipped with complete facilities and maximum comfort.',
    rules: [
      'Wajib untuk rombongan minimum 16 orang',
      'Check-in: 14:00, Check-out: 12:00',
      'Pembayaran deposit untuk keamanan',
      'Pelaporan perubahan jumlah tamu'
    ],
    rulesEn: [
      'Minimum group of 16 people required',
      'Check-in: 14:00, Check-out: 12:00',
      'Deposit required for security',
      'Reporting changes in number of guests'
    ],
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'
  },

  // RUMAH/VILLA - RF 3
  {
    id: 'rf-3',
    slug: 'rf-3-syariah',
    nameId: 'RF 3 Syariah',
    nameEn: 'RF 3 Sharia',
    type: 'rumah',
    locationId: 'Jakarta (dekat Blok M & GBK)',
    locationEn: 'Jakarta (near Blok M & GBK)',
    capacity: { min: 17, max: 27 },
    pricing: { weekday: 4000000, weekend: 5000000 },
    extraCharge: { amount: 100000, unit: 'per_person' },
    deposit: 500000,
    isGroupFriendly: true,
    minGroupSize: 17,
    highlights: [
      'Rooftop',
      'Sentuhan minimalis kayu',
      '4 kamar tidur + 1 extra',
      '6 kamar mandi',
      'Parkir 4 mobil',
      'Mesin cuci & dryer'
    ],
    highlightsEn: [
      'Rooftop',
      'Minimalist wood touches',
      '4 bedrooms + 1 extra',
      '6 bathrooms',
      'Parking for 4 cars',
      'Washing machine & dryer'
    ],
    description: '[DUMMY] Villa bergaya minimalis modern dengan desain interior yang elegan. Sangat cocok untuk rombongan yang menginginkan suasana santai namun stylish.',
    descriptionEn: '[DUMMY] Modern minimalist-style villa with elegant interior design. Very suitable for groups wanting a relaxed yet stylish atmosphere.',
    rules: [
      'Wajib untuk rombongan minimum 17 orang',
      'Check-in: 14:00, Check-out: 12:00',
      'Pembayaran deposit untuk keamanan',
      'Pelaporan perubahan jumlah tamu'
    ],
    rulesEn: [
      'Minimum group of 17 people required',
      'Check-in: 14:00, Check-out: 12:00',
      'Deposit required for security',
      'Reporting changes in number of guests'
    ],
    image: 'https://images.unsplash.com/photo-1600585152915-be4a5ca19180?w=800&q=80'
  },

  // RUMAH/VILLA - RF 4
  {
    id: 'rf-4',
    slug: 'rf-4-syariah',
    nameId: 'RF 4 Syariah',
    nameEn: 'RF 4 Sharia',
    type: 'rumah',
    locationId: 'Jakarta Timur',
    locationEn: 'East Jakarta',
    capacity: { min: 25, max: 50 },
    pricing: { weekday: 6000000, weekend: 7500000 },
    extraCharge: { amount: 1500000, unit: 'per_group', upToCapacity: 40 },
    deposit: 500000,
    isGroupFriendly: true,
    minGroupSize: 25,
    highlights: [
      '3 ruangan (10 bed, 15 bed, hall besar)',
      'Cocok acara keluarga besar',
      'Parkir bis & 6 mobil',
      'Bisa digabung dengan RF2',
      'Kapasitas hingga 50 orang'
    ],
    highlightsEn: [
      '3 rooms (10 bed, 15 bed, large hall)',
      'Great for large family events',
      'Bus parking & 6 cars',
      'Can be combined with RF2',
      'Capacity up to 50 people'
    ],
    description: '[DUMMY] Villa terbesar dengan kapasitas tertinggi, sangat ideal untuk acara rombongan besar, keluarga besar, atau gathering besar lainnya. Bisa digabungkan dengan RF2 untuk kapasitas maksimal.',
    descriptionEn: '[DUMMY] Largest villa with highest capacity, ideal for large group events, big family gatherings, or other large events. Can be combined with RF2 for maximum capacity.',
    rules: [
      'Wajib untuk rombongan minimum 25 orang',
      'Check-in: 14:00, Check-out: 12:00',
      'Pembayaran deposit untuk keamanan',
      'Koordinasi khusus untuk parkir bis'
    ],
    rulesEn: [
      'Minimum group of 25 people required',
      'Check-in: 14:00, Check-out: 12:00',
      'Deposit required for security',
      'Special coordination for bus parking'
    ],
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
  }
];
