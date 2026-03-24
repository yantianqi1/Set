const CLIENT_TOKEN_KEY = "image-set-client-token";

function readCookieValue(cookieHeader: unknown, key: string) {
  if (typeof cookieHeader !== "string") {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));

  if (!match) {
    return null;
  }

  const value = match.slice(key.length + 1).trim();
  return value ? decodeURIComponent(value) : null;
}

export function clientTokenFromRequest(headers: Record<string, unknown>) {
  const raw = headers["x-client-token"];
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (typeof token === "string" && token.trim()) {
    return token.trim();
  }

  return readCookieValue(headers.cookie, CLIENT_TOKEN_KEY);
}

export function requireClientToken(headers: Record<string, unknown>) {
  const token = clientTokenFromRequest(headers);
  if (!token) {
    throw new Error("X-Client-Token is required");
  }
  return token;
}
