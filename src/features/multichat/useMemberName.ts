import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { command } from "./services";

// Nome de exibição escolhido pelo membro no portal (/api/member); vazio enquanto carrega ou sem login.
export function useMemberName(session: Session | null): string {
  const [name, setName] = useState("");
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = () =>
      void command<{ name?: string }>("/api/member")
        .then((profile) => { if (active) setName(profile.name ?? ""); })
        .catch(() => undefined);
    load();
    // A área do membro avisa quando nome ou foto mudam.
    window.addEventListener("portal:profile-updated", load);
    return () => {
      active = false;
      window.removeEventListener("portal:profile-updated", load);
    };
  }, [userId]);
  return userId ? name : "";
}
