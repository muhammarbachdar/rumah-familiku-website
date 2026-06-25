// app/api/admin/data/route.ts
// ===== PART 1: IMPORTS =====
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Booking } from '@/lib/types';
import { getAdminSession } from '@/lib/auth/admin';
import {
  generateBookingId,
  generateUnitId,
  isDateRangeAvailable,
  groupConsecutiveDates,
  getAvailabilityMode,
} from '@/lib/utils/availability';
import { normalizeDate, parseDate, isDateInRange } from '@/lib/utils/date';
import {
  PropertySchema,
  PromoSchema,
  FAQSchema,
  AboutSchema,
  HomeSchema,
  SiteSchema,
  AppearanceSchema,
  AvailabilityBookingSchema,
} from '@/lib/schemas';
import { z, ZodError } from 'zod';

// ============ HELPERS: SERIALIZE PROPERTY (Prisma row -> JSON shape lama) ============


function serializeProperty(p: any) {
  // Serialize roomTypes for hotel
  let roomTypes = [];
  if (p.type === 'hotel' && p.roomTypes) {
    roomTypes = p.roomTypes.map((rt: any) => ({
      id: rt.roomTypeId,
      nameId: rt.nameId,
      nameEn: rt.nameEn,
      capacity: rt.capacity,
      priceWeekday: rt.priceWeekday,
      priceWeekend: rt.priceWeekend,
      images: rt.images || [],
      rooms: (rt.rooms || []).map((r: any) => ({
        id: r.roomId,
        roomNumber: r.roomNumber,
      })),
    }));
  }

  // Serialize units for non-hotel
  let units = [];
  if (p.type !== 'hotel' && p.units) {
    units = p.units.map((u: any) => ({ unitId: u.unitId, unitName: u.unitName }));
  }

  return {
    id: p.id,
    slug: p.slug,
    nameId: p.nameId,
    nameEn: p.nameEn,
    type: p.type,
    locationId: p.locationId,
    locationEn: p.locationEn,
    capacity: { min: p.capacityMin, max: p.capacityMax },
    pricing:
      p.pricingWeekday != null || p.pricingWeekend != null
        ? { weekday: p.pricingWeekday, weekend: p.pricingWeekend }
        : undefined,
    pricingMode: p.pricingMode ?? undefined,
    monthlyPrice: p.monthlyPrice ?? undefined,
    monthlyPricingWNI: p.monthlyPricingWNI ?? undefined,
    monthlyPricingWNA: p.monthlyPricingWNA ?? undefined,
    extraCharge:
      p.extraChargeAmount != null
        ? { amount: p.extraChargeAmount, unit: p.extraChargeUnit }
        : undefined,
    deposit: p.deposit ?? undefined,
    description: p.description,
    descriptionEn: p.descriptionEn,
    image: p.image,
    images: p.images,
    facilities: p.facilities ?? [],
    rules: p.rules,
    rulesEn: p.rulesEn,
    mapsUrl: p.mapsUrl,
    notes: p.notes ?? undefined,
    notesEn: p.notesEn ?? undefined,
    isGroupFriendly: p.isGroupFriendly,
    minGroupSize: p.minGroupSize ?? undefined,
    units: units,
    roomTypes: roomTypes,
    version: p.version ?? 1,
  };
}

// ============ HELPERS: SERIALIZE AVAILABILITY ============

async function serializeAvailabilityForProperty(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      units: { include: { bookings: true } },
      roomTypes: {
        include: {
          rooms: {
            include: { bookings: true },
          },
        },
      },
      bookings: { where: { unitId: null, roomId: null } },
    },
  });
  if (!property) return null;

  const mode = getAvailabilityMode(property.type);

  if (mode === 'property') {
    return {
      mode: 'property' as const,
      bookings: property.bookings.map(toBookingShape),
    };
  }

  if (property.type === 'kos') {
    // Kos: flat units
    return {
      mode: 'unit' as const,
      units: property.units.map((u) => ({
        unitId: u.unitId,
        unitName: u.unitName,
        bookings: u.bookings.map(toBookingShape),
      })),
    };
  }

  if (property.type === 'hotel') {
    // Hotel: roomTypes with nested rooms
    return {
      mode: 'unit' as const,
      roomTypes: property.roomTypes.map((rt) => ({
        roomTypeId: rt.roomTypeId,
        roomTypeName: rt.nameId,
        priceWeekday: rt.priceWeekday,
        priceWeekend: rt.priceWeekend,
        capacity: rt.capacity,
        images: rt.images,
        rooms: rt.rooms.map((r) => ({
          roomId: r.roomId,
          roomNumber: r.roomNumber,
          bookings: r.bookings.map(toBookingShape),
        })),
      })),
    };
  }

  // Apartemen/Rumah: fallback
  return {
    mode: 'unit' as const,
    units: property.units.map((u) => ({
      unitId: u.unitId,
      unitName: u.unitName,
      bookings: u.bookings.map(toBookingShape),
    })),
  };
}

function toBookingShape(b: any): Booking {
  return { id: b.id, startDate: b.startDate, endDate: b.endDate, note: b.note ?? '' };
}

// ============ HELPERS: READ DATA PER TYPE ============

async function getProperties() {
  const properties = await prisma.property.findMany({
    include: {
      units: true,
      roomTypes: {
        include: { rooms: true },
      },
    },
  });
  return properties.map(serializeProperty);
}

// ============ HELPERS: VERSION CHECK ============

async function checkVersion(
  type: string,
  id: string,
  clientVersion: number
): Promise<boolean> {
  let record: any = null;
  switch (type) {
    case 'properties':
      record = await prisma.property.findUnique({ where: { id } });
      break;
    case 'promos':
      record = await prisma.promo.findUnique({ where: { id } });
      break;
    case 'faqs':
      record = await prisma.fAQ.findUnique({ where: { id } });
      break;
    default:
      return true;
  }

  if (!record) return true;
  return record.version === clientVersion;
}

// ============ HELPERS: DESERIALIZE PROPERTY INPUT ============

function deserializePropertyInput(prop: any) {
  let roomTypesData = undefined;
  if (prop.type === 'hotel' && prop.roomTypes) {
    roomTypesData = {
      deleteMany: {},
      create: prop.roomTypes.map((rt: any) => ({
        roomTypeId: rt.id || `rt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        nameId: rt.nameId,
        nameEn: rt.nameEn,
        capacity: rt.capacity || 2,
        priceWeekday: rt.priceWeekday || 0,
        priceWeekend: rt.priceWeekend || 0,
        images: rt.images || [],
        rooms: {
          create: (rt.rooms || []).map((r: any) => ({
            roomId: r.id || `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            roomNumber: r.roomNumber,
          })),
        },
      })),
    };
  }

  let unitsData = undefined;
  if (prop.type !== 'hotel' && prop.units) {
    unitsData = {
      deleteMany: {},
      create: prop.units.map((u: any) => ({
        unitId: u.unitId || generateUnitId(),
        unitName: u.unitName,
      })),
    };
  }

  return {
    slug: prop.slug,
    nameId: prop.nameId,
    nameEn: prop.nameEn,
    type: prop.type,
    locationId: prop.locationId,
    locationEn: prop.locationEn,
    capacityMin: prop.capacity?.min,
    capacityMax: prop.capacity?.max,
    pricingWeekday: prop.pricing?.weekday,
    pricingWeekend: prop.pricing?.weekend,
    pricingMode: prop.pricingMode,
    monthlyPrice: prop.monthlyPrice,
    monthlyPricingWNI: prop.monthlyPricingWNI,
    monthlyPricingWNA: prop.monthlyPricingWNA,
    extraChargeAmount: prop.extraCharge?.amount,
    extraChargeUnit: prop.extraCharge?.unit,
    deposit: prop.deposit,
    description: prop.description,
    descriptionEn: prop.descriptionEn,
    image: prop.image,
    images: prop.images || [],
    facilities: prop.facilities || [],
    rules: prop.rules || [],
    rulesEn: prop.rulesEn || [],
    mapsUrl: prop.mapsUrl || null,
    notes: prop.notes,
    notesEn: prop.notesEn,
    isGroupFriendly: prop.isGroupFriendly || false,
    minGroupSize: prop.minGroupSize,
    version: { increment: 1 },
    roomTypes: roomTypesData,
    units: unitsData,
  };
}

// ===== PART 3: GET HANDLER =====

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'availability') {
      const propertyId = searchParams.get('propertyId');
      if (propertyId) {
        const avail = await serializeAvailabilityForProperty(propertyId);
        return NextResponse.json(avail);
      }
      const properties = await prisma.property.findMany({ select: { id: true } });
      const result: Record<string, any> = {};
      for (const p of properties) {
        const avail = await serializeAvailabilityForProperty(p.id);
        if (avail) result[p.id] = avail;
      }
      return NextResponse.json(result);
    }

    switch (type) {
      case 'properties':
        return NextResponse.json(await getProperties());
      case 'promos': {
        const promos = await prisma.promo.findMany({
          include: { properties: true },
        });
        return NextResponse.json(
          promos.map((promo: any) => ({
            id: promo.id,
            titleId: promo.titleId,
            titleEn: promo.titleEn,
            descriptionId: promo.descriptionId,
            descriptionEn: promo.descriptionEn,
            image: promo.image,
            validUntil: promo.validUntil,
            active: promo.active,
            propertyIds: promo.properties.map((pp: any) => pp.propertyId),
            version: promo.version,
          }))
        );
      }
      case 'faqs':
        return NextResponse.json(await prisma.fAQ.findMany());
      case 'about': {
        const about = await prisma.about.findFirst();
        if (!about) return NextResponse.json(null);
        return NextResponse.json({
          mission: about.mission,
          missionEn: about.missionEn,
          ctaTitle: about.ctaTitle,
          ctaTitleEn: about.ctaTitleEn,
          ctaDesc: about.ctaDesc,
          ctaDescEn: about.ctaDescEn,
          values: (about.values),
          whyChooseUs: (about.whyChooseUs),
          version: about.version,
        });
      }
      case 'home': {
        const home = await prisma.homeContent.findFirst();
        if (!home) return NextResponse.json(null);
        return NextResponse.json({
          hero: {
            titleId: home.heroTitleId,
            titleEn: home.heroTitleEn,
            subtitleId: home.heroSubtitleId,
            subtitleEn: home.heroSubtitleEn,
            ctaPrimaryId: home.heroCtaPrimaryId,
            ctaPrimaryEn: home.heroCtaPrimaryEn,
            ctaSecondaryId: home.heroCtaSecondaryId,
            ctaSecondaryEn: home.heroCtaSecondaryEn,
            image: home.heroImage,
          },
          propertyTypes: (home.propertyTypes),
          whyUs: (home.whyUs),
          reviews: (home.reviews),
          version: home.version,
        });
      }
      case 'site': {
        const site = await prisma.siteSetting.findFirst();
        if (!site) return NextResponse.json(null);
        return NextResponse.json({
          siteName: site.siteName,
          logoText: site.logoText,
          whatsappNumber: site.whatsappNumber,
          email: site.email,
          instagramUrl: site.instagramUrl,
          footerTagline: site.footerTagline,
          copyrightText: site.copyrightText,
          navLinks: (site.navLinks),
          version: site.version,
        });
      }
      case 'appearance': {
        const appearance = await prisma.appearanceSetting.findFirst();
        if (!appearance) return NextResponse.json(null);
        return NextResponse.json({
          primaryColor: appearance.primaryColor,
          accentColor: appearance.accentColor,
          backgroundColor: appearance.backgroundColor,
          version: appearance.version,
        });
      }
      default:
        return NextResponse.json(null);
    }
  } catch (error) {
    console.error('GET /api/admin/data error:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// ===== PART 4: POST HANDLER =====

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'availability') {
    return handleAvailability(request);
  }

  try {
    const body = await request.json();

    // ===== HANDLE DELETE PROPERTY =====
    if (type === 'properties' && body.action === 'deleteProperty' && body.id) {
      return await handleDeleteProperty(body.id);
    }

    // ===== VALIDATE & PROCESS OTHER TYPES =====
    let validatedBody;
    try {
      switch (type) {
        case 'properties':
          validatedBody = PropertySchema.array().parse(body);
          break;
        case 'promos':
          validatedBody = PromoSchema.array().parse(body);
          break;
        case 'faqs':
          validatedBody = FAQSchema.array().parse(body);
          break;
        case 'about':
          validatedBody = AboutSchema.parse(body);
          break;
        case 'home':
          validatedBody = HomeSchema.parse(body);
          break;
        case 'site':
          validatedBody = SiteSchema.parse(body);
          break;
        case 'appearance':
          validatedBody = AppearanceSchema.parse(body);
          break;
        default:
          return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
      }
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    switch (type) {
      case 'properties': {
        const props = validatedBody as z.infer<typeof PropertySchema>[];

        await prisma.$transaction(async (tx: any) => {
          for (const prop of props) {
            const propertyId = prop.id || `prop-${Date.now()}`;
            const slug = prop.slug || prop.nameId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const existingProp = await tx.property.findUnique({ where: { id: propertyId } });
            if (existingProp && existingProp.type !== prop.type) {
              if (prop.type === 'hotel' && existingProp.type !== 'hotel') {
                await tx.propertyUnit.deleteMany({ where: { propertyId } });
              }
              if (prop.type !== 'hotel' && existingProp.type === 'hotel') {
                await tx.roomType.deleteMany({ where: { propertyId } });
              }
            }

            if (prop.id) {
              const existing = await tx.property.findUnique({ where: { id: prop.id } });
              if (existing && existing.version !== prop.version) {
                throw new Error(`Properti "${prop.nameId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`);
              }
            }

            const basePropertyData = {
              slug,
              nameId: prop.nameId,
              nameEn: prop.nameEn,
              type: prop.type,
              locationId: prop.locationId,
              locationEn: prop.locationEn,
              mapsUrl: prop.mapsUrl || null,
              capacityMin: prop.capacity?.min || 0,
              capacityMax: prop.capacity?.max || 1,
              extraChargeAmount: prop.extraCharge?.amount,
              extraChargeUnit: prop.extraCharge?.unit,
              deposit: prop.deposit,
              description: prop.description,
              descriptionEn: prop.descriptionEn,
              image: prop.image,
              images: (prop.images || []),
              facilities: (prop.facilities || []),
              rules: (prop.rules || []),
              rulesEn: (prop.rulesEn || []),
              notes: prop.notes,
              notesEn: prop.notesEn,
              isGroupFriendly: prop.isGroupFriendly || false,
              minGroupSize: prop.minGroupSize,
            };

            let propertyData: any = { ...basePropertyData };

            if (prop.type === 'kos') {
              propertyData.pricingWeekday = null;
              propertyData.pricingWeekend = null;
              propertyData.pricingMode = prop.pricingMode ?? null;
              propertyData.monthlyPrice = prop.monthlyPrice ?? null;
              propertyData.monthlyPricingWNI = prop.monthlyPricingWNI ?? null;
              propertyData.monthlyPricingWNA = prop.monthlyPricingWNA ?? null;
            } else {
              propertyData.pricingWeekday = prop.pricing?.weekday ?? null;
              propertyData.pricingWeekend = prop.pricing?.weekend ?? null;
              propertyData.pricingMode = null;
              propertyData.monthlyPrice = null;
              propertyData.monthlyPricingWNI = null;
              propertyData.monthlyPricingWNA = null;
            }

            await tx.property.upsert({
              where: { id: propertyId },
              update: { ...propertyData, version: { increment: 1 } },
              create: { id: propertyId, ...propertyData, version: 1 },
            });

            if (prop.type !== 'hotel' && prop.units) {
              const existingUnits = await tx.propertyUnit.findMany({
                where: { propertyId },
                select: { unitId: true },
              });
              const existingUnitIds = existingUnits.map((u: any) => u.unitId);
              const requestUnitIds = prop.units.map((u: any) => u.unitId).filter(Boolean);

              const unitIdsToDelete = existingUnitIds.filter(
                (id: string) => !requestUnitIds.includes(id)
              );
              if (unitIdsToDelete.length > 0) {
                const bookingsOnUnits = await tx.booking.count({
                  where: { unitId: { in: unitIdsToDelete } },
                });
                if (bookingsOnUnits > 0) {
                  throw new Error(
                    `Tidak dapat menghapus unit karena masih ada ${bookingsOnUnits} booking terkait. Hapus booking terlebih dahulu.`
                  );
                }
                await tx.propertyUnit.deleteMany({
                  where: { unitId: { in: unitIdsToDelete }, propertyId },
                });
              }

              for (const unit of prop.units) {
                const unitId = unit.unitId || generateUnitId();
                await tx.propertyUnit.upsert({
                  where: { unitId },
                  update: { unitName: unit.unitName, propertyId },
                  create: { unitId, unitName: unit.unitName, propertyId },
                });
              }
            }

            if (prop.type === 'hotel' && prop.roomTypes) {
              const existingRoomTypes = await tx.roomType.findMany({
                where: { propertyId },
                include: { rooms: true },
              });
              const existingRoomTypeIds = existingRoomTypes.map((rt: any) => rt.roomTypeId);
              const requestRoomTypeIds = prop.roomTypes.map((rt: any) => rt.id).filter(Boolean);

              const roomTypeIdsToDelete = existingRoomTypeIds.filter(
                (id: string) => !requestRoomTypeIds.includes(id)
              );
              if (roomTypeIdsToDelete.length > 0) {
                const roomsToDelete = await tx.room.findMany({
                  where: { roomTypeId: { in: roomTypeIdsToDelete } },
                  select: { id: true },
                });
                const roomIdsToCheck = roomsToDelete.map((r: any) => r.id);
                if (roomIdsToCheck.length > 0) {
                  const bookingsOnRooms = await tx.booking.count({
                    where: { roomId: { in: roomIdsToCheck } },
                  });
                  if (bookingsOnRooms > 0) {
                    throw new Error(
                      `Tidak dapat menghapus tipe kamar karena masih ada ${bookingsOnRooms} booking terkait. Hapus booking terlebih dahulu.`
                    );
                  }
                }
                await tx.roomType.deleteMany({
                  where: { roomTypeId: { in: roomTypeIdsToDelete }, propertyId },
                });
              }

              for (const rt of prop.roomTypes) {
                const roomTypeId = rt.id || `rt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                const roomType = await tx.roomType.upsert({
                  where: { roomTypeId },
                  update: {
                    nameId: rt.nameId,
                    nameEn: rt.nameEn,
                    capacity: rt.capacity || 2,
                    priceWeekday: rt.priceWeekday || 0,
                    priceWeekend: rt.priceWeekend || 0,
                    images: rt.images || [],
                    propertyId,
                  },
                  create: {
                    roomTypeId,
                    nameId: rt.nameId,
                    nameEn: rt.nameEn,
                    capacity: rt.capacity || 2,
                    priceWeekday: rt.priceWeekday || 0,
                    priceWeekend: rt.priceWeekend || 0,
                    images: rt.images || [],
                    propertyId,
                  },
                });

                if (rt.rooms) {
                  const existingRooms = await tx.room.findMany({
                    where: { roomTypeId: roomType.id },
                    select: { roomId: true },
                  });
                  const existingRoomIds = existingRooms.map((r: any) => r.roomId);
                  const requestRoomIds = rt.rooms.map((r: any) => r.id).filter(Boolean);

                  const roomIdsToDelete = existingRoomIds.filter(
                    (id: string) => !requestRoomIds.includes(id)
                  );
                  if (roomIdsToDelete.length > 0) {
                    const bookingsOnRooms = await tx.booking.count({
                      where: { roomId: { in: roomIdsToDelete } },
                    });
                    if (bookingsOnRooms > 0) {
                      throw new Error(
                        `Tidak dapat menghapus kamar karena masih ada ${bookingsOnRooms} booking terkait. Hapus booking terlebih dahulu.`
                      );
                    }
                    await tx.room.deleteMany({
                      where: { roomId: { in: roomIdsToDelete }, roomTypeId: roomType.id },
                    });
                  }

                  for (const room of rt.rooms) {
                    const roomId = room.id || `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                    await tx.room.upsert({
                      where: { roomId },
                      update: { roomNumber: room.roomNumber || '001', roomTypeId: roomType.id },
                      create: { roomId, roomNumber: room.roomNumber || '001', roomTypeId: roomType.id },
                    });
                  }
                }
              }
            }
          }
        });

        return NextResponse.json({ success: true });
      }

      case 'promos': {
        const promos = validatedBody as z.infer<typeof PromoSchema>[];

        await prisma.$transaction(async (tx: any) => {
          for (const promo of promos) {
            const promoId = promo.id || `promo-${Date.now()}`;

            if (promo.id) {
              const existing = await tx.promo.findUnique({ where: { id: promo.id } });
              if (existing && existing.version !== promo.version) {
                throw new Error(`Promo "${promo.titleId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`);
              }
            }

            const promoData = {
              titleId: promo.titleId,
              titleEn: promo.titleEn,
              descriptionId: promo.descriptionId,
              descriptionEn: promo.descriptionEn,
              image: promo.image,
              validUntil: promo.validUntil,
              active: promo.active,
            };

            await tx.promo.upsert({
              where: { id: promoId },
              update: { ...promoData, version: { increment: 1 } },
              create: { id: promoId, ...promoData, version: 1 },
            });

            if (promo.propertyIds) {
              await tx.promoProperty.deleteMany({ where: { promoId } });
              for (const pid of promo.propertyIds) {
                await tx.promoProperty.create({
                  data: { promoId, propertyId: pid },
                });
              }
            }
          }
        });
        return NextResponse.json({ success: true });
      }

      case 'faqs': {
        const faqs = validatedBody as z.infer<typeof FAQSchema>[];

        await prisma.$transaction(async (tx: any) => {
          for (const faq of faqs) {
            const faqId = faq.id || `faq-${Date.now()}`;

            if (faq.id) {
              const existing = await tx.fAQ.findUnique({ where: { id: faq.id } });
              if (existing && existing.version !== faq.version) {
                throw new Error(`FAQ "${faq.questionId}" telah diubah oleh admin lain. Silakan refresh dan coba lagi.`);
              }
            }

            const faqData = {
              categoryId: faq.categoryId,
              categoryEn: faq.categoryEn,
              questionId: faq.questionId,
              questionEn: faq.questionEn,
              answerIdContent: faq.answerIdContent,
              answerEnContent: faq.answerEnContent,
            };
            await tx.fAQ.upsert({
              where: { id: faqId },
              update: { ...faqData, version: { increment: 1 } },
              create: { id: faqId, ...faqData, version: 1 },
            });
          }
        });
        return NextResponse.json({ success: true });
      }

      case 'about': {
        const about = validatedBody as z.infer<typeof AboutSchema>;

        const baseData = {
          mission: about.mission || '',
          missionEn: about.missionEn || '',
          ctaTitle: about.ctaTitle || '',
          ctaTitleEn: about.ctaTitleEn || '',
          ctaDesc: about.ctaDesc || '',
          ctaDescEn: about.ctaDescEn || '',
          values: (about.values || []),
          whyChooseUs: (about.whyChooseUs || []),
        };

        const existing = await prisma.about.findFirst();
        if (existing) {
          await prisma.about.update({
            where: { id: existing.id },
            data: { ...baseData, version: { increment: 1 } },
          });
        } else {
          await prisma.about.create({
            data: { ...baseData, version: 1 },
          });
        }
        return NextResponse.json({ success: true });
      }

      case 'home': {
        const home = validatedBody as z.infer<typeof HomeSchema>;

        const baseData = {
          heroTitleId: home.hero?.titleId || '',
          heroTitleEn: home.hero?.titleEn || '',
          heroSubtitleId: home.hero?.subtitleId || '',
          heroSubtitleEn: home.hero?.subtitleEn || '',
          heroCtaPrimaryId: home.hero?.ctaPrimaryId || '',
          heroCtaPrimaryEn: home.hero?.ctaPrimaryEn || '',
          heroCtaSecondaryId: home.hero?.ctaSecondaryId || '',
          heroCtaSecondaryEn: home.hero?.ctaSecondaryEn || '',
          heroImage: home.hero?.image || '',
          propertyTypes: (home.propertyTypes || []),
          whyUs: (home.whyUs || []),
          reviews: (home.reviews || []),
        };

        const existing = await prisma.homeContent.findFirst();
        if (existing) {
          await prisma.homeContent.update({
            where: { id: existing.id },
            data: { ...baseData, version: { increment: 1 } },
          });
        } else {
          await prisma.homeContent.create({
            data: { ...baseData, version: 1 },
          });
        }
        return NextResponse.json({ success: true });
      }

      case 'site': {
        const site = validatedBody as z.infer<typeof SiteSchema>;

        const baseData = {
          siteName: site.siteName || '',
          logoText: site.logoText || 'RF',
          whatsappNumber: site.whatsappNumber || '',
          email: site.email || '',
          instagramUrl: site.instagramUrl || '',
          footerTagline: site.footerTagline || '',
          copyrightText: site.copyrightText || '',
          navLinks: (site.navLinks || []),
        };

        const existing = await prisma.siteSetting.findFirst();
        if (existing) {
          await prisma.siteSetting.update({
            where: { id: existing.id },
            data: { ...baseData, version: { increment: 1 } },
          });
        } else {
          await prisma.siteSetting.create({
            data: { ...baseData, version: 1 },
          });
        }
        return NextResponse.json({ success: true });
      }

      case 'appearance': {
        const appearance = validatedBody as z.infer<typeof AppearanceSchema>;

        const baseData = {
          primaryColor: appearance.primaryColor || '#1B5E20',
          accentColor: appearance.accentColor || '#C9A84C',
          backgroundColor: appearance.backgroundColor || '#FFFFFF',
        };

        const existing = await prisma.appearanceSetting.findFirst();
        if (existing) {
          await prisma.appearanceSetting.update({
            where: { id: existing.id },
            data: { ...baseData, version: { increment: 1 } },
          });
        } else {
          await prisma.appearanceSetting.create({
            data: { ...baseData, version: 1 },
          });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/admin/data error:', error);
    return NextResponse.json(
      { error: 'Failed to write data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ===== HELPER: DELETE PROPERTY =====
async function handleDeleteProperty(propertyId: string): Promise<NextResponse> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        bookings: true,
        units: { include: { bookings: true } },
        roomTypes: { include: { rooms: { include: { bookings: true } } } },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    const today = normalizeDate(new Date());

    // Cek booking langsung di properti (mode property)
    const activeBookings = property.bookings.filter((b) => b.endDate > today);
    if (activeBookings.length > 0) {
      return NextResponse.json(
        {
          error: `Properti ini masih memiliki ${activeBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    // Cek booking di unit (kos, apartemen, rumah)
    for (const unit of property.units || []) {
      const activeUnitBookings = unit.bookings.filter((b) => b.endDate > today);
      if (activeUnitBookings.length > 0) {
        return NextResponse.json(
          {
            error: `Unit "${unit.unitName}" masih memiliki ${activeUnitBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.`,
          },
          { status: 400 }
        );
      }
    }

    // Cek booking di room (hotel)
    for (const roomType of property.roomTypes || []) {
      for (const room of roomType.rooms || []) {
        const activeRoomBookings = room.bookings.filter((b) => b.endDate > today);
        if (activeRoomBookings.length > 0) {
          return NextResponse.json(
            {
              error: `Kamar "${room.roomNumber}" masih memiliki ${activeRoomBookings.length} booking aktif/akan datang. Hapus booking terlebih dahulu.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Delete property (cascade akan menghapus units, roomTypes, rooms, bookings)
    await prisma.property.delete({
      where: { id: propertyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete property error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus properti' },
      { status: 500 }
    );
  }
}

// ===== PART 5: AVAILABILITY HANDLER =====

async function handleAvailability(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    let validated;
    try {
      validated = AvailabilityBookingSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    const { action, propertyId, unitId, roomTypeId, roomId, startDate, endDate, dates, note, bookingId, unitName } =
      validated;

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const mode = getAvailabilityMode(property.type);

    // ========== ACTION: addBooking (property mode) ==========
    if (action === 'addBooking' && mode === 'property') {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
      }

      try {
        const created = await prisma.$transaction(async (tx) => {
          const existing = await tx.booking.findMany({ where: { propertyId, unitId: null, roomId: null } });
          if (!isDateRangeAvailable(existing.map(toBookingShape), startDate, endDate)) {
            throw new Error('Tanggal overlap dengan booking yang sudah ada');
          }
          return await tx.booking.create({
            data: { id: generateBookingId(), propertyId, startDate, endDate, note: note || '' },
          });
        });
        return NextResponse.json({ success: true, booking: toBookingShape(created) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking' }, { status: 400 });
      }
    }

    // ========== ACTION: addBooking (unit mode - Kos) ==========
    if (action === 'addBooking' && mode === 'unit' && property.type === 'kos') {
      if (!unitId) {
        return NextResponse.json({ error: 'unitId is required for kos' }, { status: 400 });
      }
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
      }

      try {
        const created = await prisma.$transaction(async (tx) => {
          const unit = await tx.propertyUnit.findUnique({ where: { unitId } });
          if (!unit) throw new Error('Unit not found');
          if (unit.propertyId !== propertyId) {
            throw new Error('Unit tidak sesuai dengan properti yang diberikan');
          }
          const existing = await tx.booking.findMany({ where: { unitId: unit.id } });
          if (!isDateRangeAvailable(existing.map(toBookingShape), startDate, endDate)) {
            throw new Error('Tanggal overlap dengan booking yang sudah ada di unit ini');
          }
          return await tx.booking.create({
            data: { id: generateBookingId(), propertyId, unitId: unit.id, startDate, endDate, note: note || '' },
          });
        });
        return NextResponse.json({ success: true, booking: toBookingShape(created) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking' }, { status: 400 });
      }
    }

    // ========== ACTION: addBooking (unit mode - Hotel) ==========
    if (action === 'addBooking' && mode === 'unit' && property.type === 'hotel') {
      if (!roomId) {
        return NextResponse.json({ error: 'roomId is required for hotel' }, { status: 400 });
      }
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
      }

      try {
        const created = await prisma.$transaction(async (tx) => {
          const room = await tx.room.findUnique({
            where: { roomId },
            include: { roomType: true },
          });
          if (!room) throw new Error('Room not found');
          if (room.roomType.propertyId !== propertyId) {
            throw new Error('Room tidak sesuai dengan properti yang diberikan');
          }
          const existing = await tx.booking.findMany({ where: { roomId: room.id } });
          if (!isDateRangeAvailable(existing.map(toBookingShape), startDate, endDate)) {
            throw new Error('Tanggal overlap dengan booking yang sudah ada di kamar ini');
          }
          return await tx.booking.create({
            data: { id: generateBookingId(), propertyId, roomId: room.id, startDate, endDate, note: note || '' },
          });
        });
        return NextResponse.json({ success: true, booking: toBookingShape(created) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking' }, { status: 400 });
      }
    }

    // ========== ACTION: addBookingDates ==========
    if (action === 'addBookingDates') {
      if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return NextResponse.json({ error: 'dates array is required' }, { status: 400 });
      }

      try {
        const newBookings = await prisma.$transaction(async (tx) => {
          let existingBookings: any[] = [];

          if (property.type === 'hotel') {
            if (!roomId) {
              throw new Error('roomId is required for hotel');
            }
            const room = await tx.room.findUnique({ where: { roomId } });
            if (!room) throw new Error('Room not found');
            existingBookings = await tx.booking.findMany({ where: { roomId: room.id } });
          } else if (property.type === 'kos') {
            if (!unitId) {
              throw new Error('unitId is required for kos');
            }
            const unit = await tx.propertyUnit.findUnique({ where: { unitId } });
            if (!unit) throw new Error('Unit not found');
            existingBookings = await tx.booking.findMany({ where: { unitId: unit.id } });
          } else {
            existingBookings = await tx.booking.findMany({ where: { propertyId, unitId: null, roomId: null } });
          }

          const existingShape = existingBookings.map(toBookingShape);
          const ranges = groupConsecutiveDates(dates);

          for (const range of ranges) {
            if (!isDateRangeAvailable(existingShape, range.startDate, range.endDate)) {
              throw new Error(`Tanggal ${range.startDate} s/d ${range.endDate} overlap dengan booking yang sudah ada`);
            }
          }

          const results = [];
          for (const range of ranges) {
            const data: any = {
              id: generateBookingId(),
              propertyId,
              startDate: range.startDate,
              endDate: range.endDate,
              note: note || '',
            };

            if (property.type === 'hotel' && roomId) {
              const room = await tx.room.findUnique({ where: { roomId } });
              if (!room) throw new Error('Room not found');
              results.push(await tx.booking.create({ data: { ...data, roomId: room.id } }));
            } else if (property.type === 'kos' && unitId) {
              const unit = await tx.propertyUnit.findUnique({ where: { unitId } });
              if (!unit) throw new Error('Unit not found');
              results.push(await tx.booking.create({ data: { ...data, unitId: unit.id } }));
            } else {
              results.push(await tx.booking.create({ data }));
            }
          }
          return results;
        });

        return NextResponse.json({ success: true, bookings: newBookings.map(toBookingShape) });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to add booking dates' }, { status: 400 });
      }
    }

    // ========== ACTION: deleteBooking ==========
    if (action === 'deleteBooking') {
      if (!bookingId) {
        return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
      }

      const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!existing) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      await prisma.booking.delete({ where: { id: bookingId } });
      return NextResponse.json({ success: true });
    }

    // ========== ACTION: addUnit (Kos only) ==========
    if (action === 'addUnit') {
      if (property.type !== 'kos') {
        return NextResponse.json({ error: 'addUnit hanya untuk properti tipe Kos' }, { status: 400 });
      }
      if (!unitName) {
        return NextResponse.json({ error: 'unitName is required' }, { status: 400 });
      }

      try {
        const newUnitId = generateUnitId();
        const newUnit = await prisma.propertyUnit.create({
          data: { unitId: newUnitId, unitName, propertyId },
        });

        return NextResponse.json({
          success: true,
          unit: { unitId: newUnit.unitId, unitName: newUnit.unitName },
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: 'Nama unit sudah digunakan untuk properti ini.' },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // ========== ACTION: deleteUnit (Kos only) ==========
    if (action === 'deleteUnit') {
      if (property.type !== 'kos') {
        return NextResponse.json({ error: 'deleteUnit hanya untuk properti tipe Kos' }, { status: 400 });
      }
      if (!unitId) {
        return NextResponse.json({ error: 'unitId is required' }, { status: 400 });
      }

      const unit = await prisma.propertyUnit.findUnique({
        where: { unitId },
        include: { bookings: true },
      });
      if (!unit) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
      }

      const today = normalizeDate(new Date());
      const activeBookings = unit.bookings.filter((b) => b.endDate > today);

      if (activeBookings.length > 0) {
        return NextResponse.json(
          {
            error: `Unit ini masih memiliki ${activeBookings.length} booking aktif (termasuk yang belum mulai). Hapus booking terlebih dahulu.`,
          },
          { status: 400 }
        );
      }

      await prisma.propertyUnit.delete({ where: { unitId } });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: 'Failed to process availability request' },
      { status: 500 }
    );
  }
}