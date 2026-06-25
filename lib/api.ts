// lib/api.ts
const API_BASE = '/api/admin/data';

// ===== EXISTING FUNCTIONS =====
export async function fetchProperties() {
  const res = await fetch(`${API_BASE}?type=properties`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
}

export async function fetchPromos() {
  const res = await fetch(`${API_BASE}?type=promos`);
  if (!res.ok) throw new Error('Failed to fetch promos');
  return res.json();
}

export async function fetchFAQs() {
  const res = await fetch(`${API_BASE}?type=faqs`);
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  return res.json();
}

export async function fetchAbout() {
  const res = await fetch(`${API_BASE}?type=about`);
  if (!res.ok) throw new Error('Failed to fetch about');
  return res.json();
}

export async function fetchAppearance() {
  const res = await fetch(`${API_BASE}?type=appearance`);
  if (!res.ok) throw new Error('Failed to fetch appearance');
  return res.json();
}

export async function fetchSite() {
  const res = await fetch(`${API_BASE}?type=site`);
  if (!res.ok) throw new Error('Failed to fetch site');
  return res.json();
}

export async function fetchHome() {
  const res = await fetch(`${API_BASE}?type=home`);
  if (!res.ok) throw new Error('Failed to fetch home');
  return res.json();
}

export async function saveData(type: string, data: any) {
  const res = await fetch(`${API_BASE}?type=${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save ${type}`);
  return res.json();
}

// ===== AVAILABILITY FUNCTIONS =====

export async function fetchAvailability(propertyId?: string) {
  const url = propertyId
    ? `${API_BASE}?type=availability&propertyId=${propertyId}`
    : `${API_BASE}?type=availability`;
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
  const res = await fetch(`${API_BASE}?type=availability`, {
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
  const res = await fetch(`${API_BASE}?type=availability`, {
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
  const res = await fetch(`${API_BASE}?type=availability`, {
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
  const res = await fetch(`${API_BASE}?type=availability`, {
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
  const res = await fetch(`${API_BASE}?type=availability`, {
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

// ===== UNIT MANAGEMENT (KOS ONLY) =====
export async function addUnit(propertyId: string, unitName: string) {
  const res = await fetch(`${API_BASE}?type=availability`, {
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
  const res = await fetch(`${API_BASE}?type=availability`, {
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