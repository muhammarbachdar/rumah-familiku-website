// lib/constants/facilities.ts
import {
  Wifi, Car, Waves, Snowflake, UtensilsCrossed, Clock, Sofa, Shield,
  ArrowUpDown, Dumbbell, Shirt, Coffee, Tv, PawPrint, Cigarette,
  Mountain, Building2, Camera,
  ChefHat, WashingMachine, Bath, Droplets, Trees, Warehouse, DoorOpen,
  GraduationCap, TrainFront, KeyRound, Sparkles, Refrigerator, Laptop,
  Fan, UserCheck, DoorClosed, Landmark, ShoppingBasket, Bike, Sun,
  FlameKindling, Cross, Container, BellRing, Building, Hospital, Store,
  Plane, Dog, Baby, Briefcase, BookOpen, Utensils, Armchair, Flame,
  CarFront, BatteryCharging,
  type LucideIcon,
} from 'lucide-react';

export interface FacilityOption {
  key: string;
  icon: LucideIcon;
  labelId: string;
  labelEn: string;
}

export const FACILITY_OPTIONS: FacilityOption[] = [
  // ===== Umum (hotel & lainnya) =====
  { key: 'wifi', icon: Wifi, labelId: 'WiFi Gratis', labelEn: 'Free WiFi' },
  { key: 'parking', icon: Car, labelId: 'Parkir Gratis', labelEn: 'Free Parking' },
  { key: 'pool', icon: Waves, labelId: 'Kolam Renang', labelEn: 'Swimming Pool' },
  { key: 'ac', icon: Snowflake, labelId: 'AC', labelEn: 'Air Conditioning' },
  { key: 'restaurant', icon: UtensilsCrossed, labelId: 'Restoran', labelEn: 'Restaurant' },
  { key: 'reception24', icon: Clock, labelId: 'Resepsionis 24 Jam', labelEn: '24-Hour Reception' },
  { key: 'lobby', icon: Sofa, labelId: 'Lobby Luas', labelEn: 'Spacious Lobby' },
  { key: 'security', icon: Shield, labelId: 'Keamanan 24 Jam', labelEn: '24-Hour Security' },
  { key: 'elevator', icon: ArrowUpDown, labelId: 'Lift', labelEn: 'Elevator' },
  { key: 'gym', icon: Dumbbell, labelId: 'Gym', labelEn: 'Gym' },
  { key: 'laundry', icon: Shirt, labelId: 'Laundry', labelEn: 'Laundry' },
  { key: 'breakfast', icon: Coffee, labelId: 'Sarapan', labelEn: 'Breakfast' },
  { key: 'tv', icon: Tv, labelId: 'TV', labelEn: 'TV' },
  { key: 'petfriendly', icon: PawPrint, labelId: 'Pet Friendly', labelEn: 'Pet Friendly' },
  { key: 'smokingarea', icon: Cigarette, labelId: 'Area Merokok', labelEn: 'Smoking Area' },
  { key: 'view', icon: Mountain, labelId: 'View Bagus', labelEn: 'Great View' },
  { key: 'rooftop', icon: Building2, labelId: 'Rooftop', labelEn: 'Rooftop' },
  { key: 'cctv', icon: Camera, labelId: 'CCTV', labelEn: 'CCTV' },

  // ===== Villa/Kos/Apartemen - fasilitas dalam unit =====
  { key: 'kitchen', icon: ChefHat, labelId: 'Dapur', labelEn: 'Kitchen' },
  { key: 'washingMachine', icon: WashingMachine, labelId: 'Mesin Cuci', labelEn: 'Washing Machine' },
  { key: 'privateBathroom', icon: Bath, labelId: 'Kamar Mandi Dalam', labelEn: 'Private Bathroom' },
  { key: 'furnished', icon: Sofa, labelId: 'Perabotan Lengkap', labelEn: 'Furnished' },
  { key: 'waterHeater', icon: Droplets, labelId: 'Water Heater', labelEn: 'Water Heater' },
  { key: 'balcony', icon: DoorOpen, labelId: 'Balkon', labelEn: 'Balcony' },
  { key: 'privateEntrance', icon: KeyRound, labelId: 'Akses Pribadi', labelEn: 'Private Entrance' },
  { key: 'cleaningService', icon: Sparkles, labelId: 'Layanan Kebersihan', labelEn: 'Cleaning Service' },
  { key: 'fridge', icon: Refrigerator, labelId: 'Kulkas', labelEn: 'Refrigerator' },
  { key: 'desk', icon: Laptop, labelId: 'Meja Kerja', labelEn: 'Work Desk' },
  { key: 'closet', icon: Shirt, labelId: 'Lemari Pakaian', labelEn: 'Wardrobe' },
  { key: 'fan', icon: Fan, labelId: 'Kipas Angin', labelEn: 'Fan' },
  { key: 'terrace', icon: Sun, labelId: 'Teras', labelEn: 'Terrace' },
  { key: 'sharedKitchen', icon: Utensils, labelId: 'Dapur Bersama', labelEn: 'Shared Kitchen' },
  { key: 'outdoorSeating', icon: Armchair, labelId: 'Area Duduk Outdoor', labelEn: 'Outdoor Seating' },
  { key: 'bbqArea', icon: Flame, labelId: 'Area BBQ', labelEn: 'BBQ Area' },
  { key: 'carport', icon: CarFront, labelId: 'Carport', labelEn: 'Carport' },
  { key: 'solarPanel', icon: Sun, labelId: 'Panel Surya', labelEn: 'Solar Panel' },

  // ===== Properti luar/sekitar =====
  { key: 'garden', icon: Trees, labelId: 'Taman', labelEn: 'Garden' },
  { key: 'garage', icon: Warehouse, labelId: 'Garasi', labelEn: 'Garage' },
  { key: 'gate', icon: DoorClosed, labelId: 'Gerbang/Pagar', labelEn: 'Gate' },
  { key: 'guard', icon: UserCheck, labelId: 'Penjaga/Satpam', labelEn: 'Security Guard' },
  { key: 'bicycle', icon: Bike, labelId: 'Area Parkir Sepeda', labelEn: 'Bicycle Parking' },
  { key: 'musholla', icon: Building, labelId: 'Musholla', labelEn: 'Musholla' },
  { key: 'petArea', icon: Dog, labelId: 'Area Khusus Hewan', labelEn: 'Pet Area' },
  { key: 'kidsFriendly', icon: Baby, labelId: 'Ramah Anak', labelEn: 'Kids Friendly' },
  { key: 'coworkingSpace', icon: Briefcase, labelId: 'Co-Working Space', labelEn: 'Co-Working Space' },
  { key: 'studyRoom', icon: BookOpen, labelId: 'Ruang Belajar', labelEn: 'Study Room' },

  // ===== Keamanan & utilitas =====
  { key: 'cctprivate', icon: Camera, labelId: 'CCTV Pribadi', labelEn: 'Private CCTV' },
  { key: 'fireExtinguisher', icon: FlameKindling, labelId: 'Alat Pemadam Kebakaran', labelEn: 'Fire Extinguisher' },
  { key: 'firstAid', icon: Cross, labelId: 'Kotak P3K', labelEn: 'First Aid Kit' },
  { key: 'backupPower', icon: BatteryCharging, labelId: 'Genset/Listrik Cadangan', labelEn: 'Backup Power' },
  { key: 'waterTank', icon: Container, labelId: 'Tandon Air', labelEn: 'Water Tank' },
  { key: 'roomService', icon: BellRing, labelId: 'Room Service', labelEn: 'Room Service' },

  // ===== Lokasi sekitar =====
  { key: 'nearCampus', icon: GraduationCap, labelId: 'Dekat Kampus', labelEn: 'Near Campus' },
  { key: 'nearStation', icon: TrainFront, labelId: 'Dekat Transportasi Umum', labelEn: 'Near Public Transport' },
  { key: 'nearMosque', icon: Landmark, labelId: 'Dekat Masjid', labelEn: 'Near Mosque' },
  { key: 'nearMarket', icon: ShoppingBasket, labelId: 'Dekat Pasar/Minimarket', labelEn: 'Near Market/Minimarket' },
  { key: 'nearHospital', icon: Hospital, labelId: 'Dekat Rumah Sakit', labelEn: 'Near Hospital' },
  { key: 'nearMall', icon: Store, labelId: 'Dekat Mall', labelEn: 'Near Mall' },
  { key: 'nearAirport', icon: Plane, labelId: 'Dekat Bandara', labelEn: 'Near Airport' },
  { key: 'nearBeach', icon: Waves, labelId: 'Dekat Pantai', labelEn: 'Near Beach' },
];

export function getFacilityIcon(key: string): LucideIcon | null {
  return FACILITY_OPTIONS.find((f) => f.key === key)?.icon || null;
}