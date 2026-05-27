import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gms-greenhouse-photos';

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function useGreenhousePhotos() {
  const [photos, setPhotos] = useState(loadFromStorage);

  const setPhoto = useCallback((id, base64) => {
    setPhotos((prev) => {
      const next = { ...prev, [id]: base64 };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage quota exceeded — skip persisting
      }
      return next;
    });
  }, []);

  const removePhoto = useCallback((id) => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { photos, setPhoto, removePhoto };
}
