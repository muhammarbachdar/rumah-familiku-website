import { prisma } from '../lib/prisma';

async function main() {
  console.log('🔄 Starting migration: units → roomTypes for hotels...');

  // 1. Ambil semua properti tipe hotel
  const hotels = await prisma.property.findMany({
    where: { type: 'hotel' },
    include: { units: true },
  });

  console.log(`📊 Found ${hotels.length} hotels to migrate`);

  let migratedCount = 0;

  for (const hotel of hotels) {
    console.log(`\n🏨 Processing hotel: ${hotel.nameId} (${hotel.id})`);

    // Jika hotel sudah punya roomTypes, skip (sudah migrasi)
    const existingRoomTypes = await prisma.roomType.count({
      where: { propertyId: hotel.id },
    });

    if (existingRoomTypes > 0) {
      console.log(`   ⏭️  Already has roomTypes, skipping...`);
      continue;
    }

    // Jika hotel tidak punya units, buat default roomType dengan 1 room
    if (hotel.units.length === 0) {
      console.log(`   ⚠️  No units found, creating default roomType...`);

      await prisma.$transaction(async (tx) => {
        const roomType = await tx.roomType.create({
          data: {
            roomTypeId: `rt-${Date.now()}-default`,
            nameId: 'Standard Room',
            nameEn: 'Standard Room',
            capacity: hotel.capacityMax || 2,
            price: hotel.pricingWeekday || 0,
            propertyId: hotel.id,
            image: hotel.image || '',
          },
        });

        // Create 1 default room
        await tx.room.create({
          data: {
            roomId: `room-${Date.now()}-default`,
            roomNumber: '001',
            roomTypeId: roomType.id,
          },
        });
      });

      migratedCount++;
      console.log(`   ✅ Created default roomType with 1 room`);
      continue;
    }

    // Hotel punya units → migrasi ke roomTypes
    // Group units by name (misal "Kamar 101", "Kamar 102" → "Kamar")
    const unitGroups: Record<string, typeof hotel.units> = {};

    for (const unit of hotel.units) {
      // Ambil kata pertama sebagai group key
      const key = unit.unitName.split(' ')[0] || 'Room';
      if (!unitGroups[key]) {
        unitGroups[key] = [];
      }
      unitGroups[key].push(unit);
    }

    console.log(`   📦 Grouped into ${Object.keys(unitGroups).length} room type(s)`);

    // Buat roomType untuk setiap group
    for (const [groupName, units] of Object.entries(unitGroups)) {
      const roomTypeNameId = groupName;
      const roomTypeNameEn = groupName; // simple fallback

      await prisma.$transaction(async (tx) => {
        const roomType = await tx.roomType.create({
          data: {
            roomTypeId: `rt-${Date.now()}-${groupName.toLowerCase()}`,
            nameId: roomTypeNameId,
            nameEn: roomTypeNameEn,
            capacity: hotel.capacityMax || 2,
            price: hotel.pricingWeekday || 0,
            propertyId: hotel.id,
            image: hotel.image || '',
          },
        });

        // Create rooms from units
        for (const unit of units) {
          await tx.room.create({
            data: {
              roomId: unit.unitId, // reuse existing unitId as roomId
              roomNumber: unit.unitName.replace(/[^0-9]/g, '') || '001',
              roomTypeId: roomType.id,
            },
          });
        }
      });
    }

    migratedCount++;
    console.log(`   ✅ Migrated ${hotel.units.length} units into ${Object.keys(unitGroups).length} roomType(s)`);
  }

  console.log(`\n✅ Migration completed! ${migratedCount} hotels migrated.`);
  console.log('⚠️  NOTE: After migration, please verify data manually.');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });