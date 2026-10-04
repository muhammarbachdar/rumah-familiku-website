// lib/data/content.ts
// Data layer untuk konten publik (promos, faqs, about, home, site, appearance).
// Dipanggil LANGSUNG dari Server Component maupun dari app/api/admin/data/route.ts,
// tanpa HTTP fetch — menghindari masalah base-URL & self-request di server.

import { pool } from '@/lib/prisma';

export async function getPromos() {
  const { rows: promos } = await pool.query('SELECT * FROM "Promo" ORDER BY "createdAt" ASC');
  const { rows: links } = await pool.query('SELECT "promoId", "propertyId" FROM "PromoProperty"');

  const linksByPromo: Record<string, string[]> = {};
  for (const link of links) {
    if (!linksByPromo[link.promoId]) linksByPromo[link.promoId] = [];
    linksByPromo[link.promoId].push(link.propertyId);
  }

  return promos.map((promo: any) => ({
    id: promo.id,
    titleId: promo.titleId,
    titleEn: promo.titleEn,
    descriptionId: promo.descriptionId,
    descriptionEn: promo.descriptionEn,
    image: promo.image,
    validUntil: promo.validUntil,
    active: promo.active,
    propertyIds: linksByPromo[promo.id] || [],
    version: promo.version,
  }));
}

export async function getFAQs() {
  const { rows } = await pool.query('SELECT * FROM "FAQ" ORDER BY "createdAt" ASC');
  return rows;
}

export async function getAbout() {
  const { rows } = await pool.query('SELECT * FROM "About" LIMIT 1');
  const about = rows[0];
  if (!about) return null;
  return {
    mission: about.mission,
    missionEn: about.missionEn,
    ctaTitle: about.ctaTitle,
    ctaTitleEn: about.ctaTitleEn,
    ctaDesc: about.ctaDesc,
    ctaDescEn: about.ctaDescEn,
    values: about.values,
    whyChooseUs: about.whyChooseUs,
    version: about.version,
  };
}

export async function getHomeContent() {
  const { rows } = await pool.query('SELECT * FROM "HomeContent" LIMIT 1');
  const home = rows[0];
  if (!home) return null;
  return {
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
    propertyTypes: home.propertyTypes,
    whyUs: home.whyUs,
    reviews: home.reviews,
    version: home.version,
  };
}

export async function getSiteSettings() {
  const { rows } = await pool.query('SELECT * FROM "SiteSetting" LIMIT 1');
  const site = rows[0];
  if (!site) return null;
  return {
    siteName: site.siteName,
    logoText: site.logoText,
    whatsappNumber: site.whatsappNumber,
    email: site.email,
    instagramUrl: site.instagramUrl,
    footerTagline: site.footerTagline,
    copyrightText: site.copyrightText,
    navLinks: site.navLinks,
    version: site.version,
  };
}

export async function getAppearanceSettings() {
  const { rows } = await pool.query('SELECT * FROM "AppearanceSetting" LIMIT 1');
  const appearance = rows[0];
  if (!appearance) return null;
  return {
    primaryColor: appearance.primaryColor,
    accentColor: appearance.accentColor,
    backgroundColor: appearance.backgroundColor,
    version: appearance.version,
  };
}