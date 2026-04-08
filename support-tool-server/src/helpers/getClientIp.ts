import { Request } from "express";

const getClientIp = (req: Request): string | null => {
  // 1. Prefer IP sent explicitly by the UI (stored in localStorage, sent as x-client-ip)
  const clientIpHeader = req.headers["x-client-ip"];
  if (typeof clientIpHeader === "string" && clientIpHeader.trim()) {
    return clientIpHeader.trim();
  }

  // 2. Fall back to x-forwarded-for set by a proxy/nginx
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }

  // 3. Last resort: direct socket address (works in dev without a proxy)
  return req.ip || req.socket?.remoteAddress || null;
};

export default getClientIp;
