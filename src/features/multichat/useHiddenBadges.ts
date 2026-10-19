import { useCallback, useState } from "react";
import { parseHiddenBadges, toggleBadge } from "./badgeDefs";
import type { Platform } from "./types";

const storageKey = "mc:badges-off";

// Selos que o usuário desligou (lista de exclusão, salva só neste navegador): selo novo já nasce visível.
export function useHiddenBadges() {
  const [hidden, setHidden] = useState<string[]>(() => {
    try { return parseHiddenBadges(localStorage.getItem(storageKey)); } catch { return []; }
  });
  const toggle = useCallback((platform: Platform, id: string) => {
    setHidden((current) => {
      const next = toggleBadge(current, platform, id);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* sem armazenamento: vale só nesta sessão */ }
      return next;
    });
  }, []);
  return { hidden, toggle };
}
