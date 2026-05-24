import { useEffect } from "react";

const BASE = "SPACE.";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : BASE;
    return () => {
      document.title = BASE;
    };
  }, [title]);
}
