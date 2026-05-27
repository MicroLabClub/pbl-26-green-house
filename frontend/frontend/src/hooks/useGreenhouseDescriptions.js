import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gms-greenhouse-descriptions';

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function useGreenhouseDescriptions() {
  const [descriptions, setDescriptions] = useState(loadFromStorage);

  const setDescription = useCallback((id, text) => {
    setDescriptions((prev) => {
      const next = { ...prev, [id]: text };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeDescription = useCallback((id) => {
    setDescriptions((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { descriptions, setDescription, removeDescription };
}
