// Single place secrets get read from, so the "unset -> fall back to a known
// literal" pattern isn't duplicated (and silently trusted) in multiple files.
const DEV_JWT_SECRET = "dev-secret-change-me-please-1234567890";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) throw new Error("JWT_SECRET is not set. Generate a real secret before running in production.");
    return DEV_JWT_SECRET;
  }
  if (isProd && secret === DEV_JWT_SECRET) {
    throw new Error("JWT_SECRET is still set to the well-known default value — generate a real secret before running in production.");
  }
  return secret;
}

export const JWT_SECRET = resolveJwtSecret();
