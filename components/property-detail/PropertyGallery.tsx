// components/property-detail/PropertyGallery.tsx
'use client';

import { useState } from 'react';

interface PropertyGalleryProps {
  images: { url: string; category: string }[];
  displayName: string;
  locale: string;
}

export function PropertyGallery({ images, displayName, locale }: PropertyGalleryProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allPhotos = images;
  const activePhoto = allPhotos[activePhotoIndex];

  const goToPrevPhoto = () => setActivePhotoIndex((i) => (i === 0 ? allPhotos.length - 1 : i - 1));
  const goToNextPhoto = () => setActivePhotoIndex((i) => (i === allPhotos.length - 1 ? 0 : i + 1));

  if (!activePhoto || allPhotos.length === 0) {
    return null;
  }

  return (
    <>
      {/* ===== GALERI UTAMA ===== */}
      <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-6 bg-gray-900">
        <img
          src={activePhoto.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
        />
        <img
          src={activePhoto.url}
          alt={displayName}
          className="relative w-full h-full object-contain"
        />
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={goToPrevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-charcoal rounded-full w-9 h-9 flex items-center justify-center text-xl transition"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={goToNextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-charcoal rounded-full w-9 h-9 flex items-center justify-center text-xl transition"
              aria-label="Next photo"
            >
              ›
            </button>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {activePhotoIndex + 1} / {allPhotos.length}
            </div>
          </>
        )}
      </div>

      {/* ===== MODAL SEMUA FOTO ===== */}
      {showAllPhotos && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllPhotos(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl max-h-[85vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {locale === 'id' ? 'Semua Foto' : 'All Photos'}
              </h3>
              <button
                onClick={() => setShowAllPhotos(false)}
                className="text-gray-500 hover:text-charcoal text-xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setShowAllPhotos(false);
                  }}
                  className="block"
                >
                  <img
                    src={photo.url}
                    alt={`${displayName} ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg hover:opacity-80 transition"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== LIGHTBOX ===== */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            aria-label="Close lightbox"
          >
            ✕
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-2 md:left-6 text-white text-3xl hover:text-gray-300 z-10 bg-black/30 rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          <img
            src={allPhotos[lightboxIndex].url}
            alt={`${displayName} ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxIndex < allPhotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-2 md:right-6 text-white text-3xl hover:text-gray-300 z-10 bg-black/30 rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Next photo"
            >
              ›
            </button>
          )}

          <div className="absolute bottom-4 text-white text-sm bg-black/30 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {allPhotos.length}
          </div>
        </div>
      )}
    </>
  );
}