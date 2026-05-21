export function getBackendOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.KARSAAZ_BACKEND_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3030`;
  }

  return "http://localhost:3030";
}

