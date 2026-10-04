// lib/api.ts
const API_BASE = '/api/admin/data';
const PROPERTIES_API = '/api/admin/properties';

// ✅ TAMBAHKAN: fungsi untuk mendapatkan base URL
function getBaseUrl(): string {
  // Di server component, gunakan absolute URL
  if (typeof window === 'undefined') {
    // Server-side: gunakan NEXT_PUBLIC_BASE_URL atau fallback ke localhost
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return baseUrl;
  }
  // Client-side: gunakan relative path
  return '';
}

// ===== EXISTING FUNCTIONS =====

export async function fetchPropertiesOld() {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=properties`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
}

export async function fetchPromos() {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=promos`);
  if (!res.ok) throw new Error('Failed to fetch promos');
  return res.json();
}

export async function fetchFAQs() {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=faqs`);
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  return res.json();
}

export async function fetchAbout() {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=about`);
  if (!res.ok) throw new Error('Failed to fetch about');
  return res.json();
}

export async function fetchAppearance() {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=appearance`);
  if (!res.ok) throw new Error('Failed to fetch appearance');
  return res.json();
}

export async function fetchSite() {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=site`);
  if (!res.ok) throw new Error('Failed to fetch site');
  return res.json();
}

export async function fetchHome() {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=home`);
  if (!res.ok) throw new Error('Failed to fetch home');
  return res.json();
}

export async function saveData(type: string, data: any) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save ${type}`);
  return res.json();
}

// ===== AVAILABILITY FUNCTIONS =====

export async function fetchAvailability(propertyId?: string) {
  const base = getBaseUrl();
  const url = propertyId
    ? `${base}${API_BASE}?type=availability&propertyId=${propertyId}`
    : `${base}${API_BASE}?type=availability`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

export async function addBooking(
  propertyId: string,
  startDate: string,
  endDate: string,
  note?: string
) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addBooking',
      propertyId,
      startDate,
      endDate,
      note: note || '',
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add booking');
  }
  return res.json();
}

export async function addBookingUnit(
  propertyId: string,
  unitId: string,
  startDate: string,
  endDate: string,
  note?: string
) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addBooking',
      propertyId,
      unitId,
      startDate,
      endDate,
      note: note || '',
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add booking');
  }
  return res.json();
}

export async function addBookingRoom(
  propertyId: string,
  roomId: string,
  startDate: string,
  endDate: string,
  note?: string
) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addBooking',
      propertyId,
      roomId,
      startDate,
      endDate,
      note: note || '',
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add booking');
  }
  return res.json();
}

export async function addBookingDates(
  propertyId: string,
  dates: string[],
  note?: string,
  unitId?: string,
  roomId?: string
) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addBookingDates',
      propertyId,
      unitId,
      roomId,
      dates,
      note: note || '',
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add booking dates');
  }
  return res.json();
}

export async function deleteBooking(
  propertyId: string,
  bookingId: string,
  unitId?: string
) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteBooking',
      propertyId,
      unitId,
      bookingId,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete booking');
  }
  return res.json();
}

export async function addUnit(propertyId: string, unitName: string) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addUnit',
      propertyId,
      unitName,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add unit');
  }
  return res.json();
}

export async function deleteUnit(propertyId: string, unitId: string) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${API_BASE}?type=availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteUnit',
      propertyId,
      unitId,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete unit');
  }
  return res.json();
}

// ===== NEW: SINGLE PROPERTY ENDPOINTS =====

export async function fetchProperties(page: number = 1, limit: number = 20) {
  const base = getBaseUrl();
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  
  const res = await fetch(`${base}${PROPERTIES_API}?${params}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch properties');
  }
  return res.json();
}

export async function fetchProperty(id: string) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${PROPERTIES_API}/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch property');
  }
  return res.json();
}

export async function createProperty(property: any) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${PROPERTIES_API}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(property),
  });

  if (!res.ok) {
    const error = await res.json();
    if (error.details && Array.isArray(error.details)) {
      const messages = error.details.map((d: any) => `${d.field}: ${d.message}`).join('; ');
      throw new Error(messages || error.error || 'Failed to create property');
    }
    throw new Error(error.error || error.details || 'Failed to create property');
  }
  return res.json();
}

export async function updateProperty(id: string, property: any) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${PROPERTIES_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(property),
  });

  if (!res.ok) {
    const error = await res.json();
    if (error.details && Array.isArray(error.details)) {
      const messages = error.details.map((d: any) => `${d.field}: ${d.message}`).join('; ');
      throw new Error(messages || error.error || 'Failed to update property');
    }
    throw new Error(error.error || error.details || 'Failed to update property');
  }
  return res.json();
}

export async function deleteProperty(id: string) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${PROPERTIES_API}/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete property');
  }
  return res.json();
}