'use client';

import { useEffect } from 'react';

export default function AppearanceProvider() {
  useEffect(() => {
    async function applyAppearance() {
      try {
        const res = await fetch('/api/admin/data?type=appearance');
        const data = await res.json();
        if (!data) return;

        const root = document.documentElement;
        root.style.setProperty('--brand-green', data.primaryColor);
        root.style.setProperty('--gold', data.accentColor);
        root.style.setProperty('--background', data.backgroundColor);
      } catch (err) {
        console.error('Failed to load appearance', err);
      }
    }

    applyAppearance();
  }, []);

  return null;
}