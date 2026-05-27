import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gms-greenhouse-locations';

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function useGreenhouseLocations() {
  const [locations, setLocations] = useState(loadFromStorage);

  const setLocation = useCallback((id, lat, lng) => {
    setLocations((prev) => {
      const next = { ...prev, [id]: { lat, lng } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeLocation = useCallback((id) => {
    setLocations((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { locations, setLocation, removeLocation };
}
